<?php

namespace App\Domains\Lessons\Actions;

use App\Domains\Lessons\Events\LessonUpdated;
use App\Domains\Lessons\Repositories\LessonRepositoryInterface;
use App\Domains\Lessons\Services\LessonService;
use App\Models\Lesson;

final class UpdateLessonAction
{
    public function __construct(
        private LessonRepositoryInterface $repository,
        private LessonService $service,
    ) {
    }

    public function execute(
        Lesson $lesson,
        array $data
    ): Lesson {
        if (array_key_exists('position', $data)) {
            $this->service->validatePosition(
                (int) $data['position']
            );
        }

        $lesson = $this->repository->update(
            $lesson,
            $data
        );

        event(new LessonUpdated($lesson));

        return $lesson;
    }
}