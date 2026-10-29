<?php

namespace App\Domains\Assignments\Actions;

use App\Domains\Assignments\Models\Assignment;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class UpdateAssignmentAction
{
    public function execute(Assignment $assignment, array $data): Assignment
    {
        $changes = Arr::only($data, [
            'title',
            'instructions',
            'max_points',
            'allow_late_submissions',
        ]);

        if (array_key_exists('due_at', $data)) {
            $changes['due_at'] = $data['due_at'];
        }

        if (
            array_key_exists('slug', $data)
            && trim((string) $data['slug']) !== ''
        ) {
            $changes['slug'] = $this->uniqueSlug(
                $assignment,
                (string) $data['slug'],
            );
        }

        if (array_key_exists('max_points', $changes)) {
            $highestGrade = (float) ($assignment->submissions()->max('grade') ?? 0);

            if ((int) $changes['max_points'] < $highestGrade) {
                throw ValidationException::withMessages([
                    'max_points' => 'The maximum points cannot be lower than a grade already awarded.',
                ]);
            }
        }

        $assignment->fill($changes)->save();

        return $assignment->fresh();
    }

    private function uniqueSlug(Assignment $assignment, string $value): string
    {
        $base = Str::slug($value);

        if ($base === '') {
            $base = 'assignment';
        }

        $slug = $base;
        $suffix = 2;

        while (
            Assignment::query()
                ->where('course_id', $assignment->course_id)
                ->where('slug', $slug)
                ->whereKeyNot($assignment->getKey())
                ->exists()
        ) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
