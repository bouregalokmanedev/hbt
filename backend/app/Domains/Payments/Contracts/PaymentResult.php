<?php

namespace App\Domains\Payments\Contracts;

final class PaymentResult
{
    public function __construct(
        public readonly string $providerPaymentId,
        public readonly string $status,
        public readonly ?string $clientSecret = null,
        public readonly ?string $checkoutUrl = null,
        public readonly array $raw = [],
    ) {}
}
