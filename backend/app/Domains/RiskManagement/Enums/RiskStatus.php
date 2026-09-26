<?php

namespace App\Domains\RiskManagement\Enums;

enum RiskStatus: string
{
    case OPEN = 'open';
    case ASSESSED = 'assessed';
    case MITIGATING = 'mitigating';
    case ACCEPTED = 'accepted';
    case CLOSED = 'closed';
}
