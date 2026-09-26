<?php

namespace App\Domains\Payments\Contracts;

use App\Domains\Payments\DTOs\CreatePaymentData;
use App\Domains\Payments\DTOs\RefundPaymentData;
use App\Domains\Payments\Models\Payment;

interface PaymentGatewayInterface
{
    public function provider(): string;

    public function createPayment(CreatePaymentData $data): PaymentResult;

    public function capture(Payment $payment): PaymentResult;

    public function refund(Payment $payment, RefundPaymentData $data): RefundResult;

    public function cancel(Payment $payment): void;
}
