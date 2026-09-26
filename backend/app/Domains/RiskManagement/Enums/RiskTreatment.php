<?php

namespace App\Domains\RiskManagement\Enums;

enum RiskTreatment: string
{
    case MITIGATE = 'mitigate';
    case ACCEPT = 'accept';
    case TRANSFER = 'transfer';
    case AVOID = 'avoid';
}
