<?php

namespace App\Domains\Lessons\Listeners;

use App\Domains\Lessons\Events\LessonDeleted;
use App\Services\Audit\AuditService;

final class RecordLessonDeletedAudit
{
     public function __construct(
    private readonly AuditService $audit
) {}
    public function handle(
        LessonDeleted $event
    ): void {
     $this->audit->log(
    event: 'lesson.deleted',
    model: $event->lesson,
);
    }
}