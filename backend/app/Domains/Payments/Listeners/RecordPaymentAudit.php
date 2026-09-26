<?php

namespace App\Domains\Payments\Listeners;

use App\Domains\Payments\Events\PaymentFailed;
use App\Domains\Payments\Events\PaymentRefunded;
use App\Domains\Payments\Events\PaymentSucceeded;
use App\Services\Audit\AuditService;
use Illuminate\Contracts\Queue\ShouldQueue;

class RecordPaymentAudit implements ShouldQueue
{
    public function handle(PaymentSucceeded|PaymentFailed|PaymentRefunded $event): void
    {
        $payment = $event->payment;
        $type = match (true) {
            $event instanceof PaymentSucceeded => 'payment.succeeded',
            $event instanceof PaymentFailed => 'payment.failed',
            $event instanceof PaymentRefunded => 'payment.refunded',
        };
        app(AuditService::class)->log($type, $payment, [], ['status' => $payment->status->value]);
    }
}
