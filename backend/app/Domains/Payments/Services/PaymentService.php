<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\Enums\PaymentProvider;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Events\PaymentFailed;
use App\Domains\Payments\Events\PaymentRefunded;
use App\Domains\Payments\Events\PaymentSucceeded;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Models\PaymentTransaction;
use App\Domains\Payments\Services\InvoiceService;
use App\Events\ModelChanged;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentService
{
    public function markSucceeded(Payment $payment, array $metadata = []): Payment
    {
        return DB::transaction(function () use ($payment, $metadata) {
            if ($payment->status === PaymentStatus::SUCCEEDED) {
                return $payment;
            }

            $payment->update([
                'status' => PaymentStatus::SUCCEEDED->value,
                'paid_at' => now(),
                'metadata' => array_merge($payment->metadata ?? [], $metadata),
            ]);

            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'type' => 'sale',
                'provider_transaction_id' => $payment->provider_payment_id,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'status' => 'succeeded',
                'metadata' => $metadata,
            ]);

            $order = $payment->order;
            if ($order && $order->status !== 'paid') {
                $order->update(['status' => 'paid', 'paid_at' => now()]);
                event(new ModelChanged(event: 'order.paid', model: $order, old: ['status' => 'pending'], new: ['status' => 'paid']));
                app(InvoiceService::class)->forOrder($order);
            }

            event(new PaymentSucceeded($payment->fresh()));

            return $payment->fresh();
        });
    }

    public function markFailed(Payment $payment, string $code, string $message): Payment
    {
        return DB::transaction(function () use ($payment, $code, $message) {
            $payment->update([
                'status' => PaymentStatus::FAILED->value,
                'failed_at' => now(),
                'failure_code' => $code,
                'failure_message' => $message,
            ]);

            event(new PaymentFailed($payment->fresh()));

            return $payment->fresh();
        });
    }

    public function refund(Payment $payment, int $amount, string $reason): Payment
    {
        return DB::transaction(function () use ($payment, $amount, $reason) {
            abort_unless($payment->canBeRefunded(), 422, 'Only succeeded payments can be refunded.');
            abort_if($amount > $payment->amount, 422, 'Refund amount exceeds payment amount.');

            $isPartial = $amount < $payment->amount;

            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'type' => $isPartial ? 'partial_refund' : 'refund',
                'amount' => $amount,
                'currency' => $payment->currency,
                'status' => 'succeeded',
                'metadata' => ['reason' => $reason],
            ]);

            $payment->update([
                'status' => $isPartial ? PaymentStatus::PARTIALLY_REFUNDED->value : PaymentStatus::REFUNDED->value,
                'refunded_at' => now(),
            ]);

            event(new PaymentRefunded($payment->fresh(), $amount));

            return $payment->fresh();
        });
    }

    public function createOrder(array $items, string $provider, string $currency, string $idempotencyKey, int $userId): Order
    {
        return DB::transaction(function () use ($items, $provider, $currency, $idempotencyKey, $userId) {
            $existing = Order::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return $existing;
            }

            $subtotal = 0;
            foreach ($items as $item) {
                $subtotal += (int) ($item['unit_price'] * $item['quantity']);
            }

            $order = Order::create([
                'user_id' => $userId,
                'currency' => $currency,
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'status' => 'pending',
                'provider' => $provider,
                'idempotency_key' => $idempotencyKey,
                'placed_at' => now(),
            ]);

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

            return $order->fresh(['items']);
        });
    }
}
