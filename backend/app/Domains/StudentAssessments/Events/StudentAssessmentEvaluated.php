<?php

namespace App\Domains\StudentAssessments\Events;

use App\Domains\Assessments\Models\AssessmentResult;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class StudentAssessmentEvaluated
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly AssessmentResult $result) {}
}
