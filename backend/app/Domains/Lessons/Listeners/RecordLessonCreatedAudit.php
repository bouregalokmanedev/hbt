<?php

namespace App\Domains\Lessons\Listeners;

use App\Domains\Lessons\Events\LessonCreated;
use App\Services\Audit\AuditService;

final class RecordLessonCreatedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        LessonCreated $event
    ): void {
        $this->audit->log(
            event: 'lesson.created',
            model: $event->lesson,
            new: $event->lesson->toArray(),
        );
    }
}