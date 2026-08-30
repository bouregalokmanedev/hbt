<?php

namespace App\Domains\DiagnosticScenarios\Enums;

enum DiagnosticScenarioAttemptStatus: string
{
    case IN_PROGRESS = 'in_progress';
    case SUBMITTED = 'submitted';
    case PASSED = 'passed';
    case FAILED = 'failed';
    case EXPIRED = 'expired';
}