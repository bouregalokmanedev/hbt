<?php

namespace App\Domains\Payments\Enums;

enum TransactionStatus: string
{
    case PENDING = 'pending';
    case SUCCEEDED = 'succeeded';
    case FAILED = 'failed';
    case REFUNDED = 'refunded';
    case DISPUTED = 'disputed';
}
