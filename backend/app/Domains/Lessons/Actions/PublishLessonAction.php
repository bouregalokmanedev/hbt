<?php

namespace App\Domains\Lessons\Actions;

use App\Domains\Lessons\Events\LessonPublished;
use App\Domains\Lessons\Repositories\LessonRepositoryInterface;
use App\Domains\Lessons\Services\LessonService;
use App\Models\Lesson;
use Illuminate\Support\Facades\DB;

final class PublishLessonAction
{
    public function __construct(
        private LessonRepositoryInterface $repository,
        private LessonService $service,
    ) {
    }

    public function execute(Lesson $lesson): Lesson
    {
        return DB::transaction(function () use ($lesson) {

            /*
             * Validate the lesson and change its state.
             *
             * LessonService::publish() is responsible for:
             * - title requirement
             * - slug requirement
             * - content requirement
             * - changing status to PUBLISHED
             */
            $this->service->publish($lesson);

            $lesson = $this->repository->update(
                $lesson,
                [
                    'status' => $lesson->status,
                ]
            );

            event(new LessonPublished($lesson));

            return $lesson;
        });
    }
}
