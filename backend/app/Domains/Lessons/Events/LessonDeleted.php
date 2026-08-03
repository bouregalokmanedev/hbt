<?php

namespace App\Domains\Lessons\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

final class LessonDeleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public readonly string $lessonId,
        public readonly string $sectionId,
    ) {}
}