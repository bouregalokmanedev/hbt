<?php

namespace App\Domains\Payments\Events;

use App\Domains\Payments\Models\Subscription;
use Illuminate\Foundation\Events\Dispatchable;

class SubscriptionPaymentFailed
{
    use Dispatchable;

    public function __construct(public readonly \App\Domains\Payments\Models\Subscription $subscription) {}
}
