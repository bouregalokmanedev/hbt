<?php

namespace App\Domains\Lessons\Listeners;

use App\Domains\Lessons\Events\LessonCompleted;
use App\Services\Audit\AuditService;

final class RecordLessonCompletedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(LessonCompleted $event): void
    {
        $this->audit->log(
            event: 'lesson.completed',
            model: $event->progress,
            new: $event->progress->toArray(),
        );
    }
}