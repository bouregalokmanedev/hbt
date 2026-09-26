<?php

namespace App\Domains\Payments\Http\Controllers;

use App\Domains\Payments\Models\Payment;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = Payment::query()
            ->with(['order:id,status', 'order.items'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $payments->getCollection()->map(fn (Payment $p) => [
                'id' => $p->id,
                'provider' => $p->provider->value,
                'status' => $p->status->value,
                'amount' => $p->amount,
                'currency' => $p->currency,
                'order_id' => $p->order_id,
                'created_at' => $p->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function show(Request $request, Payment $payment): JsonResponse
    {
        abort_unless($payment->user_id === $request->user()->id, 403);

        $payment->load(['order', 'transactions']);

        return response()->json([
            'success' => true,
            'message' => 'Payment retrieved.',
            'data' => [
                'id' => $payment->id,
                'provider' => $payment->provider->value,
                'provider_payment_id' => $payment->provider_payment_id,
                'status' => $payment->status->value,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
                'order_id' => $payment->order_id,
                'transactions' => $payment->transactions->map(fn ($t) => [
                    'id' => $t->id,
                    'type' => $t->type->value,
                    'amount' => $t->amount,
                    'status' => $t->status,
                ]),
                'created_at' => $payment->created_at?->toISOString(),
            ],
        ]);
    }
}
