<?php

namespace App\Domains\Payments\DTOs;

final readonly class CreateCheckoutData
{
    public function __construct(
        public string $userId,
        public array $items,
        public string $provider,
        public string $currency,
        public string $idempotencyKey,
        public ?string $couponCode = null,
    ) {}
}
