<?php

namespace App\Domains\DiagnosticScenarios\Enums;

enum DiagnosticActionType: string
{
    case INSPECT = 'inspect';
    case SCAN = 'scan';
    case MEASURE = 'measure';
    case TEST = 'test';
    case IDENTIFY = 'identify';
    case DIAGNOSE = 'diagnose';
    case REPAIR = 'repair';
}