<?php

namespace App\Domains\Payments\Http\Controllers;

use App\Domains\Payments\Actions\CreateCheckoutAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function store(Request $request, CreateCheckoutAction $checkout): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:10'],
            'items.*.course_id' => ['required', 'uuid', 'exists:courses,id'],
            'items.*.quantity' => ['sometimes', 'integer', 'min:1', 'max:1'],
            'provider' => ['sometimes', 'string', 'in:stripe,paypal,manual'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'idempotency_key' => ['sometimes', 'string', 'max:80'],
        ]);

        $provider = $data['provider'] ?? 'stripe';
        $currency = strtoupper($data['currency'] ?? config('app.currency', 'DZD'));
        $key = $data['idempotency_key'] ?? (string) \Illuminate\Support\Str::uuid();

        $result = $checkout->execute(
            userId: $request->user()->id,
            items: $data['items'],
            provider: $provider,
            currency: $currency,
            idempotencyKey: $key,
        );

        if ($result['free']) {
            return response()->json([
                'success' => true,
                'message' => 'Order completed — no payment required.',
                'data' => [
                    'order_id' => $result['order']->id,
                    'status' => $result['order']->status,
                    'free' => true,
                ],
            ]);
        }

        $payment = $result['payment'];

        return response()->json([
            'success' => true,
            'message' => 'Checkout created.',
            'data' => [
                'order_id' => $result['order']->id,
                'payment_id' => $payment->id,
                'provider' => $payment->provider->value,
                'provider_payment_id' => $payment->provider_payment_id,
                'status' => $payment->status->value,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'client_secret' => $payment->metadata['client_secret'] ?? $payment->metadata['checkout_url'] ?? null,
                'idempotency_key' => $payment->idempotency_key,
            ],
        ], 201);
    }

    public function show(Request $request, string $orderId): JsonResponse
    {
        $order = \App\Domains\Payments\Models\Order::with(['items', 'payments'])
            ->where('id', $orderId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $latestPayment = $order->payments->sortByDesc('created_at')->first();

        return response()->json([
            'success' => true,
            'message' => 'Order retrieved.',
            'data' => [
                'id' => $order->id,
                'status' => $order->status,
                'total' => $order->total,
                'currency' => $order->currency,
                'provider' => $order->provider,
                'client_secret' => $latestPayment?->metadata['client_secret'] ?? null,
                'items' => $order->items->map(fn ($item) => [
                    'purchasable_type' => class_basename($item->purchasable_type),
                    'purchasable_id' => $item->purchasable_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total' => $item->total,
                ]),
                'payments' => $order->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'provider_payment_id' => $p->provider_payment_id,
                    'status' => $p->status->value,
                    'amount' => $p->amount,
                ]),
            ],
        ]);
    }
}
