<?php

namespace App\Domains\Courses\Events;

use App\Models\Section;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class SectionReordered implements ShouldDispatchAfterCommit
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Section $section,
        public readonly int $oldPosition,
        public readonly int $newPosition,
    ) {}
}