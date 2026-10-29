<?php

namespace App\Domains\Bootcamps\Services;

use App\Enums\Bootcamps\BootcampStatus;
use App\Models\Bootcamp;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class BootcampService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, int $instructorId): Bootcamp
    {
        $title = trim((string) $data['title']);
        $description = trim((string) $data['description']);

        return Bootcamp::create([
            'instructor_id' => $instructorId,
            'title' => $title,
            'slug' => $this->uniqueSlug((string) ($data['slug'] ?? $title)),
            'short_description' => $this->shortDescription($data, $description),
            'description' => $description,
            'duration_value' => (int) $data['duration_value'],
            'duration_unit' => $data['duration_unit'],
            'location' => trim((string) $data['location']),
            'price' => $data['price'],
            'currency' => strtoupper((string) ($data['currency'] ?? 'DZD')),
            'level' => $data['level'],
            'includes' => $this->mergeIncludes($data['includes'] ?? null),
            'status' => BootcampStatus::DRAFT,
            'published_at' => null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Bootcamp $bootcamp, array $data): Bootcamp
    {
        $attributes = [];

        foreach ([
            'title',
            'short_description',
            'description',
            'duration_value',
            'duration_unit',
            'location',
            'price',
            'currency',
            'level',
        ] as $key) {
            if (array_key_exists($key, $data)) {
                $attributes[$key] = $data[$key];
            }
        }

        if (array_key_exists('title', $attributes)) {
            $attributes['title'] = trim((string) $attributes['title']);
        }

        if (array_key_exists('location', $attributes)) {
            $attributes['location'] = trim((string) $attributes['location']);
        }

        if (array_key_exists('currency', $attributes)) {
            $attributes['currency'] = strtoupper(
                (string) ($attributes['currency'] ?: 'DZD')
            );
        }

        if (array_key_exists('short_description', $data)
            && blank($data['short_description'])) {
            $description = $attributes['description']
                ?? $bootcamp->description;

            $attributes['short_description'] = Str::limit(
                trim(strip_tags((string) $description)),
                180
            );
        }

        if (! empty($data['slug'])) {
            $attributes['slug'] = $this->uniqueSlug(
                (string) $data['slug'],
                $bootcamp->id
            );
        }

        if (array_key_exists('includes', $data)) {
            $attributes['includes'] = $this->mergeIncludes(
                $data['includes'],
                $bootcamp->normalisedIncludes()
            );
        }

        $bootcamp->update($attributes);

        return $bootcamp->refresh();
    }

    /**
     * Replace the bootcamp curriculum in one atomic operation.
     *
     * Incoming IDs that do not belong to this bootcamp are ignored, so an
     * instructor can never move another instructor's sections into their own
     * syllabus.
     *
     * @param  array<int, array<string, mixed>>  $sections
     */
    public function syncCurriculum(Bootcamp $bootcamp, array $sections): Bootcamp
    {
        DB::transaction(function () use ($bootcamp, $sections): void {
            $keptSectionIds = [];

            foreach (array_values($sections) as $sectionIndex => $sectionData) {
                $section = null;

                if (! empty($sectionData['id'])) {
                    $section = $bootcamp->sections()
                        ->whereKey($sectionData['id'])
                        ->first();
                }

                if (! $section) {
                    $section = $bootcamp->sections()->create([
                        'title' => trim((string) $sectionData['title']),
                        'position' => $sectionIndex + 1,
                    ]);
                } else {
                    $section->update([
                        'title' => trim((string) $sectionData['title']),
                        'position' => $sectionIndex + 1,
                    ]);
                }

                $keptLessonIds = [];

                foreach (array_values($sectionData['lessons'] ?? []) as $lessonIndex => $lessonData) {
                    $lesson = null;

                    if (! empty($lessonData['id'])) {
                        $lesson = $section->lessons()
                            ->whereKey($lessonData['id'])
                            ->first();
                    }

                    if (! $lesson) {
                        $lesson = $section->lessons()->create([
                            'title' => trim((string) $lessonData['title']),
                            'classroom_count' => (int) $lessonData['classroom_count'],
                            'duration_minutes' => (int) $lessonData['duration_minutes'],
                            'position' => $lessonIndex + 1,
                        ]);
                    } else {
                        $lesson->update([
                            'title' => trim((string) $lessonData['title']),
                            'classroom_count' => (int) $lessonData['classroom_count'],
                            'duration_minutes' => (int) $lessonData['duration_minutes'],
                            'position' => $lessonIndex + 1,
                        ]);
                    }

                    $keptLessonIds[] = $lesson->id;
                }

                $section->lessons()
                    ->whereNotIn('id', $keptLessonIds)
                    ->delete();

                $keptSectionIds[] = $section->id;
            }

            $bootcamp->sections()
                ->whereNotIn('id', $keptSectionIds)
                ->delete();
        });

        return $bootcamp->load('sections.lessons');
    }

    /**
     * @param  array<string, mixed>|null  $includes
     * @param  array<string, bool>  $base
     * @return array<string, bool>
     */
    private function mergeIncludes(
        ?array $includes,
        array $base = Bootcamp::DEFAULT_INCLUDES,
    ): array {
        $normalised = array_merge(
            $base,
            $includes ?? []
        );

        return array_intersect_key(
            array_map(static fn ($value) => (bool) $value, $normalised),
            Bootcamp::DEFAULT_INCLUDES
        );
    }

    private function shortDescription(array $data, string $description): string
    {
        $value = trim((string) ($data['short_description'] ?? ''));

        return $value !== ''
            ? $value
            : Str::limit(trim(strip_tags($description)), 180);
    }

    private function uniqueSlug(string $value, ?string $ignoreId = null): string
    {
        $base = Str::slug($value);
        $base = $base !== '' ? $base : 'bootcamp';

        $slug = $base;
        $suffix = 2;

        while (
            Bootcamp::withTrashed()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
