<?php

namespace App\Domains\Lessons\Events;

use App\Models\LessonProgress;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

final class LessonCompleted implements ShouldDispatchAfterCommit

{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly LessonProgress $progress,
    ) {
    }
}