<?php

namespace App\Domains\Payments\Contracts;

use App\Domains\Payments\Models\Transaction;

/**
 * Payment provider contract.
 *
 * The platform ships with the manual provider (bank transfer / cash /
 * admin-confirmed payments). Real providers (Stripe, CIB, EDAHABIA…)
 * implement this same contract so the domain never changes.
 */
interface PaymentProvider
{
    public function name(): string;

    /**
     * Prepare provider-side data for a pending transaction
     * (checkout session, reference, instructions…).
     *
     * @return array<string, mixed>
     */
    public function initiate(Transaction $transaction): array;

    /**
     * Whether this provider can settle without admin intervention.
     */
    public function settlesAutomatically(): bool;
}
