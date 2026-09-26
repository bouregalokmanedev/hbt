<?php

namespace App\Domains\Payments\DTOs;

final readonly class CreatePaymentData
{
    public function __construct(
        public string $orderId,
        public string $userId,
        public int $amount,
        public string $currency,
        public string $provider,
        public string $paymentMethodType,
        public string $idempotencyKey,
        public ?string $paymentMethodId = null,
        public array $metadata = [],
    ) {}
}
