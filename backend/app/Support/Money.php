<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Money convention for the whole application.
 *
 * Internally every amount is stored and exposed as a major unit (for example
 * 2500 means 2,500 DZD). Provider APIs such as Stripe expect the smallest
 * currency unit (2,500 DZD == 250000), so conversion happens only at the
 * gateway boundary.
 */
final class Money
{
    /**
     * ISO 4217 currencies that have no minor unit.
     *
     * @var list<string>
     */
    private const ZERO_DECIMAL_CURRENCIES = [
        'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
        'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
    ];

    public static function normalizeCurrency(?string $currency, ?string $fallback = null): string
    {
        $value = strtoupper(trim((string) ($currency ?: $fallback ?: config('app.currency', 'DZD'))));

        if (! preg_match('/^[A-Z]{3}$/', $value)) {
            throw new InvalidArgumentException('Currency must be a three-letter ISO 4217 code.');
        }

        return $value;
    }

    public static function decimals(string $currency): int
    {
        return in_array(strtoupper($currency), self::ZERO_DECIMAL_CURRENCIES, true) ? 0 : 2;
    }

    /**
     * Convert a major-unit amount (2,500 DZD) to a provider minor-unit amount
     * (250,000).
     */
    public static function toMinorUnits(int $amount, string $currency): int
    {
        return (int) round($amount * (10 ** self::decimals($currency)));
    }

    /**
     * Convert a provider minor-unit amount back to the application's
     * major-unit representation.
     */
    public static function fromMinorUnits(int $minorAmount, string $currency): float
    {
        return $minorAmount / (10 ** self::decimals($currency));
    }

    /**
     * @return list<string>
     */
    public static function supportedCurrencies(): array
    {
        return array_values(array_unique(array_map(
            'strtoupper',
            (array) config('payments.supported_currencies', ['DZD']),
        )));
    }

    public static function isSupported(string $currency): bool
    {
        return in_array(strtoupper($currency), self::supportedCurrencies(), true);
    }

    public static function assertSupported(string $currency): void
    {
        if (! self::isSupported($currency)) {
            throw new InvalidArgumentException("Unsupported currency: {$currency}.");
        }
    }
}
