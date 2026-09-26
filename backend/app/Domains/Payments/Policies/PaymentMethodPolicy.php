<?php

namespace App\Domains\Payments\Policies;

use App\Domains\Payments\Models\PaymentMethod;
use App\Models\User;

class PaymentMethodPolicy
{
    public function view(User $user, PaymentMethod $method): bool
    {
        return $method->user_id === $user->id;
    }

    public function delete(User $user, PaymentMethod $method): bool
    {
        return $method->user_id === $user->id;
    }

    public function setDefault(User $user, PaymentMethod $method): bool
    {
        return $method->user_id === $user->id;
    }
}
