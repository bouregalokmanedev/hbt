<?php

namespace App\Domains\StudentAssessments\Enums;

enum ResponseStatus: string
{
    case NOT_STARTED = 'not_started';
    case IN_PROGRESS = 'in_progress';
    case ANSWERED = 'answered';
    case FLAGGED = 'flagged';
    case SKIPPED = 'skipped';
}
