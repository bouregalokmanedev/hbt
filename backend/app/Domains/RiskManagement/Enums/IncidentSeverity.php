<?php

namespace App\Domains\RiskManagement\Enums;

enum IncidentSeverity: string
{
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case CRITICAL = 'critical';
}
