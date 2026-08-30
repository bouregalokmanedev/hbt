<?php

namespace App\Domains\Assessments\Events;

use App\Domains\Assessments\Models\AssessmentResult;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class AssessmentPassed
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public AssessmentResult $result,
    ) {}
}