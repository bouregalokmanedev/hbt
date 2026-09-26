<?php

namespace App\Domains\StudentAssessments\Enums;

enum AssessmentResultStatus: string
{
    case PENDING = 'pending';
    case EVALUATING = 'evaluating';
    case COMPLETED = 'completed';
    case FAILED = 'failed';
    case AVAILABLE = 'available';
}
