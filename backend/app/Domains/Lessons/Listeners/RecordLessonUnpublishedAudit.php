<?php

namespace App\Domains\Lessons\Listeners;

use App\Domains\Lessons\Events\LessonUnpublished;
use App\Services\Audit\AuditService;

final class RecordLessonUnpublishedAudit
{
     public function __construct(
    private readonly AuditService $audit
) {}
    public function handle(
        LessonUnpublished $event
    ): void {
         $this->audit->log(
    event: 'lesson.unpublished',
    model: $event->lesson,
);
    }
}