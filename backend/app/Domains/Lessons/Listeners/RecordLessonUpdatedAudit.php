<?php

namespace App\Domains\Lessons\Listeners;

use App\Domains\Lessons\Events\LessonUpdated;
use App\Services\Audit\AuditService;

final class RecordLessonUpdatedAudit
{
     public function __construct(
    private readonly AuditService $audit
) {}

    public function handle(
        LessonUpdated $event
    ): void {
        $this->audit->log(
    event: 'lesson.updated',
    model: $event->lesson,
);
    }
}