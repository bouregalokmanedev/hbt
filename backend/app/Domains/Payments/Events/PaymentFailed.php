<?php

namespace App\Domains\Payments\Events;

use App\Domains\Payments\Models\Payment;
use Illuminate\Foundation\Events\Dispatchable;

class PaymentFailed
{
    use Dispatchable;

    public function __construct(public readonly Payment $payment) {}
}
