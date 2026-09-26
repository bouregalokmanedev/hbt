<?php

namespace App\Domains\RiskManagement\Enums;

enum IncidentStatus: string
{
    case OPEN = 'open';
    case ACKNOWLEDGED = 'acknowledged';
    case CONTAINED = 'contained';
    case RESOLVED = 'resolved';
    case CLOSED = 'closed';
}
