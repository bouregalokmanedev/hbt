<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\Enums\PaymentMethodType;
use App\Domains\Payments\Enums\PaymentProvider;
use App\Domains\Payments\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentMethodService
{
    public function attach(User $user, array $data): PaymentMethod
    {
        return DB::transaction(function () use ($user, $data) {
            $type = PaymentMethodType::from($data['type'] ?? 'card');
            $provider = PaymentProvider::from($data['provider'] ?? 'stripe');

            // Apple Pay is modeled as stripe + apple_pay, not a separate provider
            if ($type === PaymentMethodType::APPLE_PAY) {
                $provider = PaymentProvider::STRIPE;
            }

            // Tamara (BNPL) is its own provider with no card metadata.
            if ($type === PaymentMethodType::TAMARA) {
                $provider = PaymentProvider::TAMARA;
            }

            $method = PaymentMethod::create([
                'user_id' => $user->id,
                'provider' => $provider->value,
                'provider_payment_method_id' => $data['provider_payment_method_id'] ?? 'pm_stub_'.substr((string) Str::uuid(), 0, 8),
                'type' => $type->value,
                'brand' => $data['brand'] ?? match ($type) {
                    PaymentMethodType::APPLE_PAY => 'apple_pay',
                    PaymentMethodType::TAMARA => 'tamara',
                    default => 'visa',
                },
                'last_four' => $type === PaymentMethodType::TAMARA ? ($data['last_four'] ?? null) : ($data['last_four'] ?? '4242'),
                'exp_month' => $data['exp_month'] ?? null,
                'exp_year' => $data['exp_year'] ?? null,
                'is_default' => false,
                'billing_name' => $data['billing_name'] ?? null,
                'billing_country' => $data['billing_country'] ?? null,
                'metadata' => $data['metadata'] ?? null,
            ]);

            // First method becomes default automatically
            if (PaymentMethod::where('user_id', $user->id)->count() === 1) {
                $method->update(['is_default' => true]);
            }

            return $method->fresh();
        });
    }

    public function setDefault(User $user, PaymentMethod $method): PaymentMethod
    {
        return DB::transaction(function () use ($user, $method) {
            PaymentMethod::where('user_id', $user->id)->update(['is_default' => false]);
            $method->update(['is_default' => true]);
            return $method->fresh();
        });
    }

    public function detach(PaymentMethod $method): void
    {
        $wasDefault = $method->is_default;
        $userId = $method->user_id;
        $method->delete();

        if ($wasDefault) {
            $next = PaymentMethod::where('user_id', $userId)->latest()->first();
            if ($next) {
                $next->update(['is_default' => true]);
            }
        }
    }
}
