<?php

namespace App\Domains\Lessons\Listeners;

use App\Domains\Lessons\Events\LessonPublished;
use App\Services\Audit\AuditService;

final class RecordLessonPublishedAudit
{
     public function __construct(
    private readonly AuditService $audit
) {}
    public function handle(
        LessonPublished $event
    ): void {
        $this->audit->log(
    event: 'lesson.published',
    model: $event->lesson,
);
    }
}