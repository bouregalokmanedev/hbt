<?php

namespace App\Domains\StudentAssessments\Events;

use App\Domains\StudentAssessments\Models\StudentAssessmentResponse;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class StudentResponseSaved
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly StudentAssessmentResponse $response) {}
}
