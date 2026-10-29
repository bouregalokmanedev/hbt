<?php

namespace App\Enums\Bootcamps;

enum BootcampPaymentMethod: string
{
    case CASH = 'cash';
    case VISA_CARD = 'visa_card';
    case BANK_TRANSFER = 'bank_transfer';
}
