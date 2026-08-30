<?php

namespace App\Domains\Assessments\Enums;

enum AssessmentAttemptStatus: string
{
    case IN_PROGRESS = 'in_progress';
    case SUBMITTED = 'submitted';
    case PASSED = 'passed';
    case FAILED = 'failed';
    case EXPIRED = 'expired';
}