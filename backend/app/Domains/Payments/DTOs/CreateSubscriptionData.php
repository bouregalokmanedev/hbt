<?php

namespace App\Domains\Payments\DTOs;

final readonly class CreateSubscriptionData
{
    public function __construct(
        public string $userId,
        public string $planId,
        public string $provider,
        public string $idempotencyKey,
        public ?string $paymentMethodId = null,
    ) {}
}
