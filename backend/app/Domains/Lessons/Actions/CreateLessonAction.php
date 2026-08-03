<?php

namespace App\Domains\Lessons\Actions;

use App\Domains\Lessons\Events\LessonCreated;
use App\Domains\Lessons\Repositories\LessonRepositoryInterface;
use App\Domains\Lessons\Services\LessonService;
use App\Models\Lesson;

final class CreateLessonAction
{
    public function __construct(
        private LessonRepositoryInterface $repository,
        private LessonService $service,
    ) {
    }

    public function execute(array $data): Lesson
    {
        $this->service->validatePosition(
            (int) $data['position']
        );

        $lesson = $this->repository->create($data);

        event(new LessonCreated($lesson));

        return $lesson;
    }
}