<?php

namespace App\Domains\Payments\Enums;

enum PaymentStatus: string
{
    case PENDING = 'pending';
    case REQUIRES_ACTION = 'requires_action';
    case PROCESSING = 'processing';
    case SUCCEEDED = 'succeeded';
    case FAILED = 'failed';
    case CANCELLED = 'cancelled';
    case PARTIALLY_REFUNDED = 'partially_refunded';
    case REFUNDED = 'refunded';
}
