<?php

namespace App\Domains\Payments\DTOs;

final readonly class RefundPaymentData
{
    public function __construct(
        public int $amount,
        public string $reason,
        public string $idempotencyKey,
    ) {}
}
