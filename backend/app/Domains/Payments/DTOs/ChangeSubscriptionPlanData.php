<?php

namespace App\Domains\Payments\DTOs;

final readonly class ChangeSubscriptionPlanData
{
    public function __construct(
        public string $providerSubscriptionId,
        public string $newPlanId,
    ) {}
}
