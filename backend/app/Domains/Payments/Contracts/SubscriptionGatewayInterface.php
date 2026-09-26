<?php

namespace App\Domains\Payments\Contracts;

use App\Domains\Payments\DTOs\ChangeSubscriptionPlanData;
use App\Domains\Payments\DTOs\CreateSubscriptionData;

interface SubscriptionGatewayInterface
{
    public function provider(): string;

    public function createSubscription(CreateSubscriptionData $data): SubscriptionResult;

    public function cancel(string $providerSubscriptionId): void;

    public function changePlan(ChangeSubscriptionPlanData $data): void;
}
