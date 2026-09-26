<?php

namespace App\Domains\Payments\Providers;

use App\Domains\Payments\Contracts\PaymentProvider;
use App\Domains\Payments\Models\Transaction;

class ManualPaymentProvider implements PaymentProvider
{
    public function name(): string
    {
        return 'manual';
    }

    public function initiate(Transaction $transaction): array
    {
        $transaction->update([
            'provider_ref' => 'MANUAL-'.strtoupper(substr($transaction->id, 0, 8)),
        ]);

        return [
            'reference' => $transaction->fresh()->provider_ref,
            'instructions' => 'Complete the payment through the agreed channel, then an administrator will confirm your transaction.',
        ];
    }

    public function settlesAutomatically(): bool
    {
        return false;
    }
}
