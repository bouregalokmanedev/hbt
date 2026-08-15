<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Events\SectionProgressUpdated;
use App\Domains\Courses\Services\CourseProgressService;

final class SyncCourseProgress
{
    public function __construct(
        private readonly CourseProgressService $service,
    ) {}

    public function handle(SectionProgressUpdated $event): void
    {
        $section = $event->progress->section;

        $this->service->sync(
            $event->progress->user,
            $section->course,
        );
    }
}