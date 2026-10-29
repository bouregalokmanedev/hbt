<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\DTOs\RefundPaymentData;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Enums\TransactionType;
use App\Domains\Payments\Events\PaymentFailed;
use App\Domains\Payments\Events\PaymentRefunded;
use App\Domains\Payments\Events\PaymentSucceeded;
use App\Domains\Payments\Exceptions\PaymentException;
use App\Domains\Payments\Exceptions\RefundNotAllowedException;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Models\PaymentTransaction;
use App\Events\ModelChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function __construct(
        private PaymentGatewayRegistry $gateways,
    ) {}

    /**
     * Idempotent success transition. A payment may be reported as successful
     * by a webhook, by an admin confirmation, or by the checkout flow; only
     * the first transition may create a sale transaction, invoice, or event.
     */
    public function markSucceeded(Payment $payment, array $metadata = []): Payment
    {
        return DB::transaction(function () use ($payment, $metadata) {
            $locked = Payment::query()
                ->whereKey($payment->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            // Never move a refunded/cancelled payment back to succeeded.
            if (in_array($locked->status, [
                PaymentStatus::SUCCEEDED,
                PaymentStatus::PARTIALLY_REFUNDED,
                PaymentStatus::REFUNDED,
                PaymentStatus::CANCELLED,
            ], true)) {
                return $locked;
            }

            $locked->update([
                'status' => PaymentStatus::SUCCEEDED->value,
                'paid_at' => $locked->paid_at ?? now(),
                'failed_at' => null,
                'failure_code' => null,
                'failure_message' => null,
                'metadata' => array_merge($locked->metadata ?? [], $metadata),
            ]);

            PaymentTransaction::query()->createOrFirst(
                ['idempotency_key' => 'sale:'.$locked->id],
                [
                    'payment_id' => $locked->id,
                    'type' => TransactionType::SALE->value,
                    'provider_transaction_id' => $locked->provider_payment_id,
                    'amount' => $locked->amount,
                    'currency' => $locked->currency,
                    'status' => 'succeeded',
                    'metadata' => $metadata,
                ],
            );

            $order = $locked->order_id
                ? Order::query()->whereKey($locked->order_id)->lockForUpdate()->first()
                : null;

            if ($order && $order->status !== 'paid') {
                $order->update(['status' => 'paid', 'paid_at' => now()]);
                event(new ModelChanged(
                    event: 'order.paid',
                    model: $order,
                    old: ['status' => 'pending'],
                    new: ['status' => 'paid'],
                ));
                app(InvoiceService::class)->forOrder($order);
            }

            $fresh = $locked->fresh();
            event(new PaymentSucceeded($fresh));

            return $fresh;
        });
    }

    /**
     * Idempotent failure transition. A late failure must never downgrade a
     * payment that has already succeeded or been refunded.
     */
    public function markFailed(Payment $payment, string $code, string $message): Payment
    {
        return DB::transaction(function () use ($payment, $code, $message) {
            $locked = Payment::query()
                ->whereKey($payment->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if (in_array($locked->status, [
                PaymentStatus::SUCCEEDED,
                PaymentStatus::PARTIALLY_REFUNDED,
                PaymentStatus::REFUNDED,
                PaymentStatus::CANCELLED,
                PaymentStatus::FAILED,
            ], true)) {
                return $locked;
            }

            $locked->update([
                'status' => PaymentStatus::FAILED->value,
                'failed_at' => now(),
                'failure_code' => $code,
                'failure_message' => $message,
            ]);

            $fresh = $locked->fresh();
            event(new PaymentFailed($fresh));

            return $fresh;
        });
    }

    /**
     * Refund the payment through its provider, then record the result
     * locally. The row lock serialises competing refunds so two admins can
     * never refund more than the captured amount.
     */
    public function refund(Payment $payment, int $amount, string $reason, ?string $idempotencyKey = null): Payment
    {
        if ($amount <= 0) {
            throw new RefundNotAllowedException('Refund amount must be greater than zero.');
        }

        $key = $idempotencyKey ?: 'refund:'.$payment->id.':'.Str::uuid();

        return DB::transaction(function () use ($payment, $amount, $reason, $key) {
            $locked = Payment::query()
                ->whereKey($payment->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $existing = PaymentTransaction::query()
                ->where('idempotency_key', $key)
                ->first();

            if ($existing) {
                if ($existing->payment_id !== $locked->id) {
                    throw new PaymentException('This refund idempotency key belongs to another payment.');
                }

                return $locked->fresh();
            }

            if (! $locked->canBeRefunded()) {
                throw new RefundNotAllowedException('This payment has no refundable balance.');
            }

            $remaining = $locked->refundableAmount();
            if ($amount > $remaining) {
                throw new RefundNotAllowedException(
                    "Refund amount exceeds the remaining refundable balance of {$remaining} {$locked->currency}."
                );
            }

            $provider = $locked->provider->value;
            $result = $this->gateways->gateway($provider)->refund(
                $locked,
                new RefundPaymentData(
                    amount: $amount,
                    reason: $reason,
                    idempotencyKey: $key,
                ),
            );

            if (strtolower($result->status) !== 'succeeded') {
                throw new PaymentException(
                    "The payment provider did not complete the refund (status: {$result->status})."
                );
            }

            $isFullRefund = $amount === $remaining;

            PaymentTransaction::create([
                'idempotency_key' => $key,
                'payment_id' => $locked->id,
                'type' => $isFullRefund ? TransactionType::REFUND->value : TransactionType::PARTIAL_REFUND->value,
                'provider_transaction_id' => $result->providerRefundId,
                'amount' => $amount,
                'currency' => $locked->currency,
                'status' => 'succeeded',
                'metadata' => [
                    'reason' => $reason,
                    'provider_status' => $result->status,
                ],
            ]);

            $fullyRefunded = $locked->refundedAmount() >= $locked->amount;

            $locked->update([
                'status' => $fullyRefunded
                    ? PaymentStatus::REFUNDED->value
                    : PaymentStatus::PARTIALLY_REFUNDED->value,
                'refunded_at' => $locked->refunded_at ?? now(),
            ]);

            $fresh = $locked->fresh();
            event(new PaymentRefunded($fresh, $amount));

            return $fresh;
        });
    }

    public function createOrder(array $items, string $provider, string $currency, string $idempotencyKey, int $userId): Order
    {
        return DB::transaction(function () use ($items, $provider, $currency, $idempotencyKey, $userId) {
            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += (int) ($item['unit_price'] * ($item['quantity'] ?? 1));
            }

            // Idempotency is scoped to the buyer: two users may legitimately
            // use the same client-generated key without seeing each other's
            // orders.
            $order = Order::query()->createOrFirst(
                ['user_id' => $userId, 'idempotency_key' => $idempotencyKey],
                [
                    'currency' => $currency,
                    'subtotal' => $subtotal,
                    'total' => $subtotal,
                    'status' => 'pending',
                    'provider' => $provider,
                    'placed_at' => now(),
                ],
            );

            if ($order->wasRecentlyCreated) {
                foreach ($items as $item) {
                    $order->items()->create([
                        'purchasable_type' => $item['purchasable_type'],
                        'purchasable_id' => $item['purchasable_id'],
                        'quantity' => $item['quantity'] ?? 1,
                        'unit_price' => $item['unit_price'],
                        'total' => (int) ($item['unit_price'] * ($item['quantity'] ?? 1)),
                        'metadata' => $item['metadata'] ?? null,
                    ]);
                }
            }

            return $order->loadMissing('items');
        });
    }
}
