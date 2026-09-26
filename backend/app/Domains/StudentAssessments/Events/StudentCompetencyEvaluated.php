<?php

namespace App\Domains\StudentAssessments\Events;

use App\Domains\StudentAssessments\Models\StudentAssessmentResult;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class StudentCompetencyEvaluated
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly StudentAssessmentResult $result) {}
}
