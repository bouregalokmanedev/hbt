<?php

namespace App\Domains\Payments\Contracts;

final class SubscriptionResult
{
    public function __construct(
        public readonly string $providerSubscriptionId,
        public readonly string $status,
        public readonly ?string $clientSecret = null,
        public readonly array $raw = [],
    ) {}
}
