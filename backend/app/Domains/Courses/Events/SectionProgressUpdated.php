<?php

namespace App\Domains\Courses\Events;

use App\Models\SectionProgress;

final class SectionProgressUpdated
{
    public function __construct(
        public readonly SectionProgress $progress,
    ) {}
}