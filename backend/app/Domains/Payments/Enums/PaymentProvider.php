<?php

namespace App\Domains\Payments\Enums;

enum PaymentProvider: string
{
    case STRIPE = 'stripe';
    case PAYPAL = 'paypal';
    case MANUAL = 'manual';
    case TAMARA = 'tamara';
}
