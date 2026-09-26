<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\Enums\InvoiceStatus;
use App\Domains\Payments\Models\Invoice;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Models\Subscription;
use Illuminate\Support\Str;

class InvoiceService
{
    public function forOrder(Order $order): Invoice
    {
        $existing = Invoice::where('order_id', $order->id)->first();
        if ($existing) {
            return $existing;
        }

        return Invoice::create([
            'user_id' => $order->user_id,
            'order_id' => $order->id,
            'provider' => $order->provider,
            'number' => 'INV-'.strtoupper(Str::random(8)),
            'currency' => $order->currency,
            'subtotal' => $order->subtotal,
            'discount_amount' => $order->discount_amount,
            'tax_amount' => $order->tax_amount,
            'total' => $order->total,
            'status' => $order->status === 'paid' ? InvoiceStatus::PAID->value : InvoiceStatus::OPEN->value,
            'issued_at' => now(),
            'due_at' => now()->addDays(7),
            'paid_at' => $order->paid_at,
        ]);
    }

    public function forSubscription(Subscription $subscription, int $amount, string $periodStart, string $periodEnd): Invoice
    {
        return Invoice::create([
            'user_id' => $subscription->user_id,
            'subscription_id' => $subscription->id,
            'provider' => $subscription->provider,
            'number' => 'INV-'.strtoupper(Str::random(8)),
            'currency' => $subscription->currency,
            'subtotal' => $amount,
            'total' => $amount,
            'status' => InvoiceStatus::OPEN->value,
            'issued_at' => now(),
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
        ]);
    }

    public function markPaid(Invoice $invoice): Invoice
    {
        $invoice->update(['status' => InvoiceStatus::PAID->value, 'paid_at' => now()]);
        return $invoice->fresh();
    }
}
