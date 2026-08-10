<?php

namespace App\Domains\Lessons\Actions;

use App\Domains\Lessons\Repositories\LessonRepositoryInterface;
use App\Domains\Lessons\Services\LessonService;
use App\Models\Lesson;
use Illuminate\Support\Facades\DB;
use App\Domains\Lessons\Events\LessonReordered;
use DomainException;

final class ReorderLessonAction
{
    public function __construct(
        private LessonRepositoryInterface $repository,
        private LessonService $service,
    ) {
    }

    public function execute(
    Lesson $lesson,
    int $newPosition
): Lesson {
    $this->service->validateReorderPosition(
        $newPosition
    );

    $lessonCount = $this->repository->countBySection(
        $lesson->section_id
    );

   if ($newPosition === $lesson->position) {
    return $lesson;
}

if ($newPosition > $lessonCount) {
    throw new DomainException(
        'Lesson position must be within the section lesson range.'
    );
}

    $oldPosition = $lesson->position;

    if ($oldPosition === $newPosition) {
        return $lesson->fresh();
    }

    return DB::transaction(function () use (
        $lesson,
        $oldPosition,
        $newPosition
    ) {
        $this->repository->shiftPositions(
            $lesson->section_id,
            $oldPosition,
            $newPosition
        );

        $updatedLesson = $this->repository->update(
            $lesson,
            [
                'position' => $newPosition,
            ]
        );

        event(new LessonReordered(
            $updatedLesson,
            $oldPosition,
            $newPosition
        ));

        return $updatedLesson;
    });
}
}