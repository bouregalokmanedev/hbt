<?php

namespace App\Domains\Security\Enums;

enum SecuritySeverity: string
{
    case INFO = 'info';
    case LOW = 'low';
    case MEDIUM = 'medium';
    case HIGH = 'high';
    case CRITICAL = 'critical';
}
