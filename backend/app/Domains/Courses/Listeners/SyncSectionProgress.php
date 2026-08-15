<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Services\SectionProgressService;
use App\Domains\Lessons\Events\LessonProgressUpdated;

final class SyncSectionProgress
{
    public function __construct(
        private readonly SectionProgressService $service
    ) {
    }

    public function handle(LessonProgressUpdated $event): void
    {
        $lesson = $event->progress->lesson;

        $this->service->sync(
            $event->progress->user,
            $lesson->section
        );
    }
}