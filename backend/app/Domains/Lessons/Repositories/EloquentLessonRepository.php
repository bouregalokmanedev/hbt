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

    DB::transaction(function () use (
        $sectionId,
        $fromPosition,
        $toPosition
    ) {
        /*
         * Get all lessons for this section in their
         * current ordering.
         */
        $lessons = Lesson::query()
            ->where('section_id', $sectionId)
            ->orderBy('position')
            ->get();

        /*
         * Find the lesson that is being moved.
         */
        $movingLesson = $lessons->firstWhere(
            'position',
            $fromPosition
        );

        if (! $movingLesson) {
            return;
        }

        /*
         * Remove the moving lesson from the collection.
         */
        $ordered = $lessons
            ->reject(
                fn (Lesson $lesson) =>
                    $lesson->id === $movingLesson->id
            )
            ->values();

        /*
         * Convert the requested position into a zero-based index.
         *
         * Position 1 => index 0
         * Position 2 => index 1
         * Position 3 => index 2
         */
        $newIndex = max(0, $toPosition - 1);

        /*
         * Insert the moving lesson at its new position.
         */
        $ordered->splice(
            $newIndex,
            0,
            [$movingLesson]
        );

        /*
         * Phase 1:
         *
         * Move EVERY lesson to a temporary unique position.
         *
         * This is the important part.
         *
         * We cannot safely change:
         *
         * 1 -> 2
         * 2 -> 3
         * 3 -> 1
         *
         * directly because of the UNIQUE constraint on:
         *
         * (section_id, position)
         */
        foreach ($ordered as $index => $lesson) {
            $lesson->update([
                'position' => 1000000 + $index,
            ]);
        }

        /*
         * Phase 2:
         *
         * Assign the final positions.
         */
        foreach ($ordered as $index => $lesson) {
            $lesson->update([
                'position' => $index + 1,
            ]);
        }
    });
}
public function move(
    Lesson $lesson,
    int $newPosition
): Lesson {
    return DB::transaction(function () use (
        $lesson,
        $newPosition
    ) {
        $oldPosition = $lesson->position;

        if ($oldPosition === $newPosition) {
            return $lesson->fresh();
        }

        $sectionId = $lesson->section_id;

        $lessons = Lesson::query()
            ->where('section_id', $sectionId)
            ->orderBy('position')
            ->get();

        /*
         * Build the desired ordering in PHP.
         */
        $ordered = $lessons
            ->reject(fn (Lesson $item) => $item->id === $lesson->id)
            ->values();

        $newIndex = max(0, $newPosition - 1);

        $ordered->splice(
            $newIndex,
            0,
            [$lesson]
        );

        /*
         * Phase 1:
         * Give every lesson a unique temporary position.
         */
        foreach ($ordered as $index => $item) {
            $item->update([
                'position' => 1000000 + $index,
            ]);
        }

        /*
         * Phase 2:
         * Assign final positions.
         */
        foreach ($ordered as $index => $item) {
            $item->update([
                'position' => $index + 1,
            ]);
        }

        return $lesson->fresh();
    });
}
}