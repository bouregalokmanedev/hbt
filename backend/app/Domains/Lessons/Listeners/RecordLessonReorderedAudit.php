<?php

namespace App\Domains\Lessons\Listeners;

use App\Domains\Lessons\Events\LessonReordered;
use App\Services\Audit\AuditService;

final class RecordLessonReorderedAudit
{
    public function __construct(
        private readonly AuditService $audit
    ) {}

    public function handle(
        LessonReordered $event
    ): void {
        $this->audit->log(
            event: 'lesson.reorder',
            model: $event->lesson,
        );
    }
}
