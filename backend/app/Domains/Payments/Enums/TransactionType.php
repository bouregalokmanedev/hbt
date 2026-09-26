<?php

namespace App\Domains\Payments\Enums;

enum TransactionType: string
{
    case AUTHORIZATION = 'authorization';
    case CAPTURE = 'capture';
    case SALE = 'sale';
    case REFUND = 'refund';
    case PARTIAL_REFUND = 'partial_refund';
    case REVERSAL = 'reversal';
    case CHARGEBACK = 'chargeback';
}
