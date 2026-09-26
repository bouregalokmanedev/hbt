<?php

namespace App\Domains\Payments\Enums;

enum SubscriptionStatus: string
{
    case PENDING = 'pending';
    case TRIAL = 'trial';
    case ACTIVE = 'active';
    case PAST_DUE = 'past_due';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';
}
