<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Contracts\SubscriptionGatewayInterface;
use App\Domains\Payments\Enums\PaymentProvider;
use App\Domains\Payments\Exceptions\InvalidPaymentProviderException;
use App\Domains\Payments\Exceptions\PaymentProviderUnavailableException;
use App\Domains\Payments\Exceptions\UnsupportedCurrencyException;
use App\Domains\Payments\Gateways\Manual\ManualPaymentGateway;
use App\Domains\Payments\Gateways\Manual\ManualSubscriptionGateway;
use App\Domains\Payments\Gateways\PayPal\PayPalPaymentGateway;
use App\Domains\Payments\Gateways\PayPal\PayPalSubscriptionGateway;
use App\Domains\Payments\Gateways\Stripe\StripePaymentGateway;
use App\Domains\Payments\Gateways\Stripe\StripeSubscriptionGateway;
use App\Support\Money;

/**
 * Single place that decides whether a provider may be used for a given
 * currency. Gateways themselves never get to pretend a disabled or
 * unsupported provider is available.
 */
class PaymentGatewayRegistry
{
    public function gateway(string $provider): PaymentGatewayInterface
    {
        $provider = $this->normalizeProvider($provider);

        return match ($provider) {
            PaymentProvider::STRIPE->value => app(StripePaymentGateway::class),
            PaymentProvider::PAYPAL->value => app(PayPalPaymentGateway::class),
            PaymentProvider::MANUAL->value => app(ManualPaymentGateway::class),
            default => throw new InvalidPaymentProviderException("Unknown payment provider: {$provider}."),
        };
    }

    public function subscriptionGateway(string $provider): SubscriptionGatewayInterface
    {
        $provider = $this->normalizeProvider($provider);

        return match ($provider) {
            PaymentProvider::STRIPE->value => app(StripeSubscriptionGateway::class),
            PaymentProvider::PAYPAL->value => app(PayPalSubscriptionGateway::class),
            PaymentProvider::MANUAL->value => app(ManualSubscriptionGateway::class),
            default => throw new InvalidPaymentProviderException("Unknown payment provider: {$provider}."),
        };
    }

    public function assertCanProcess(string $provider, string $currency): void
    {
        $provider = $this->normalizeProvider($provider);
        $currency = Money::normalizeCurrency($currency);

        if (! Money::isSupported($currency)) {
            throw new UnsupportedCurrencyException("Currency {$currency} is not supported by this platform.");
        }

        if (! $this->enabled($provider)) {
            throw new PaymentProviderUnavailableException("Payment provider {$provider} is not enabled.");
        }

        if (! $this->providerSupportsCurrency($provider, $currency)) {
            throw new UnsupportedCurrencyException(
                "Payment provider {$provider} does not support {$currency} payments."
            );
        }
    }

    public function supportsCurrency(string $provider, string $currency): bool
    {
        $provider = strtolower(trim($provider));
        $currency = strtoupper(trim($currency));

        return $this->enabled($provider)
            && Money::isSupported($currency)
            && $this->providerSupportsCurrency($provider, $currency);
    }

    /**
     * Pick the first enabled provider (in config order) that can charge the
     * currency. Stripe wins for currencies it supports; manual settlement is
     * the fallback for currencies such as DZD.
     */
    public function defaultProviderFor(string $currency): string
    {
        $currency = Money::normalizeCurrency($currency);

        foreach (array_keys((array) config('payments.providers', [])) as $provider) {
            if ($this->supportsCurrency($provider, $currency)) {
                return $provider;
            }
        }

        throw new UnsupportedCurrencyException("No enabled payment provider supports {$currency}.");
    }

    public function enabled(string $provider): bool
    {
        $provider = strtolower(trim($provider));

        return (bool) config("payments.providers.{$provider}.enabled", false);
    }

    public function providerSupportsCurrency(string $provider, string $currency): bool
    {
        $provider = strtolower(trim($provider));
        $currency = strtoupper(trim($currency));
        $currencies = (array) config("payments.providers.{$provider}.currencies", []);

        if ($currencies === [] || in_array('*', $currencies, true)) {
            return true;
        }

        return in_array($currency, array_map('strtoupper', $currencies), true);
    }

    private function normalizeProvider(string $provider): string
    {
        $provider = strtolower(trim($provider));

        if (! array_key_exists($provider, (array) config('payments.providers', []))) {
            throw new InvalidPaymentProviderException("Unknown payment provider: {$provider}.");
        }

        if (! $this->enabled($provider)) {
            throw new PaymentProviderUnavailableException("Payment provider {$provider} is not enabled.");
        }

        return $provider;
    }
}
