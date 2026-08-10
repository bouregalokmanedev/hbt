<?php

namespace App\Domains\Lessons\Repositories;

use App\Models\Lesson;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

final class EloquentLessonRepository implements LessonRepositoryInterface
{
    public function find(
        string $id
    ): ?Lesson {
        return Lesson::query()
            ->find($id);
    }

    public function findOrFail(
        string $id
    ): Lesson {
        return Lesson::query()
            ->findOrFail($id);
    }
    public function countBySection(
    string $sectionId
): int {
    return Lesson::query()
        ->where('section_id', $sectionId)
        ->count();
}

    public function findBySection(
        string $sectionId
    ): Collection {
        return Lesson::query()
            ->where('section_id', $sectionId)
            ->orderBy('position')
            ->get();
    }

    public function findBySectionAndPosition(
        string $sectionId,
        int $position
    ): ?Lesson {
        return Lesson::query()
            ->where('section_id', $sectionId)
            ->where('position', $position)
            ->first();
    }

    public function create(
        array $data
    ): Lesson {
        return Lesson::query()
            ->create($data);
    }

    public function update(
        Lesson $lesson,
        array $data
    ): Lesson {
        $lesson->update($data);

        return $lesson->fresh();
    }

    public function delete(
        Lesson $lesson
    ): void {
        $lesson->delete();
    }

public function shiftPositions(
    string $sectionId,
    int $fromPosition,
    int $toPosition
): void {
    if ($fromPosition === $toPosition) {
        return;
    }

    $lessons = Lesson::query()
        ->where('section_id', $sectionId)
        ->orderBy('position')
        ->get();

    $movingLesson = $lessons->firstWhere(
        'position',
        $fromPosition
    );

    if (! $movingLesson) {
        return;
    }

    $ordered = $lessons
        ->reject(
            fn (Lesson $lesson): bool =>
                $lesson->id === $movingLesson->id
        )
        ->values();

    $newIndex = max(0, $toPosition - 1);

    $ordered->splice(
        $newIndex,
        0,
        [$movingLesson]
    );

    /*
     * Temporary positions prevent collisions
     * with the unique (section_id, position) constraint.
     */
    foreach ($ordered as $index => $lesson) {
        $lesson->update([
            'position' => 1_000_000 + $index,
        ]);
    }

    foreach ($ordered as $index => $lesson) {
        $lesson->update([
            'position' => $index + 1,
        ]);
    }
}
}