<?php

namespace App\Domains\StudentAssessments\Events;

use App\Domains\Assessments\Models\AssessmentAttempt;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class StudentAssessmentResumed
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly AssessmentAttempt $attempt) {}
}
