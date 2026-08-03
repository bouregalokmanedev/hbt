<?php

namespace App\Domains\Lessons\Actions;

use App\Domains\Lessons\Repositories\LessonRepositoryInterface;
use App\Domains\Lessons\Services\LessonService;
use App\Models\Lesson;
use Illuminate\Support\Facades\DB;
use App\Domains\Lessons\Events\LessonUnpublished;

final class UnpublishLessonAction
{
    public function __construct(
        private LessonRepositoryInterface $repository,
        private LessonService $service,
    ) {
    }

    public function execute(Lesson $lesson): Lesson
    {
        return DB::transaction(function () use ($lesson) {

            $this->service->unpublish($lesson);

             event(new LessonUnpublished($lesson));

            return $this->repository->update(
                $lesson,
                [
                    'status' => $lesson->status,
                ]
            );
           
        });
    }
}