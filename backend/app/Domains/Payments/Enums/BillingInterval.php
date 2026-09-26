<?php

namespace App\Domains\Payments\Enums;

enum BillingInterval: string
{
    case DAY = 'day';
    case WEEK = 'week';
    case MONTH = 'month';
    case YEAR = 'year';
}
