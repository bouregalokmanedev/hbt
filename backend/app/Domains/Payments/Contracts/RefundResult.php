<?php

namespace App\Domains\Payments\Contracts;

final class RefundResult
{
    public function __construct(
        public readonly string $providerRefundId,
        public readonly string $status,
        public readonly array $raw = [],
    ) {}
}
