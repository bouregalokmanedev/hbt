<?php

namespace App\Domains\Lessons\Actions;

use App\Domains\Lessons\Events\LessonDeleted;
use App\Domains\Lessons\Repositories\LessonRepositoryInterface;
use App\Models\Lesson;

final class DeleteLessonAction
{
    public function __construct(
        private LessonRepositoryInterface $repository,
    ) {
    }

    public function execute(
    Lesson $lesson
): void {
    $this->repository->delete($lesson);

    event(new LessonDeleted($lesson));
}
}