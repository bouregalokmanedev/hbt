<?php

namespace App\Domains\Assignments\Enums;

enum AssignmentSubmissionStatus: string
{
    case SUBMITTED = 'submitted';
    case GRADED = 'graded';
}
