<?php

namespace App\Domains\Payments\Enums;

enum PaymentMethodType: string
{
    case CARD = 'card';
    case APPLE_PAY = 'apple_pay';
    case PAYPAL = 'paypal';
    case TAMARA = 'tamara';
}
