<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Payments\Actions\HandleWebhookAction;
use App\Domains\Payments\Actions\ProcessWebhookEventAction;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Models\Invoice;
use App\Domains\Payments\Models\Order;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Models\WebhookEvent;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCanonicalPaymentsController extends Controller
{
    public function orders(Request $request): JsonResponse
    {
        $query = Order::with(['user:id,first_name,last_name,email', 'items']);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($provider = $request->query('provider')) {
            $query->where('provider', $provider);
        }
        if ($search = trim((string) $request->query('search', ''))) {
            $query->whereHas('user', fn ($q) => $q->where('email', 'like', "%{$search}%"));
        }

        $orders = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $orders->getCollection()->map(fn (Order $o) => [
                'id' => $o->id,
                'user' => $o->user?->full_name,
                'email' => $o->user?->email,
                'status' => $o->status,
                'total' => $o->total,
                'currency' => $o->currency,
                'provider' => $o->provider,
                'items_count' => $o->items->count(),
                'created_at' => $o->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function showOrder(Order $order): JsonResponse
    {
        $order->load(['user:id,first_name,last_name,email', 'items', 'payments']);

        return response()->json([
            'success' => true,
            'message' => 'Order retrieved.',
            'data' => [
                'id' => $order->id,
                'status' => $order->status,
                'total' => $order->total,
                'currency' => $order->currency,
                'provider' => $order->provider,
                'user' => $order->user?->full_name,
                'email' => $order->user?->email,
                'items' => $order->items->map(fn ($i) => [
                    'purchasable_type' => class_basename($i->purchasable_type),
                    'purchasable_id' => $i->purchasable_id,
                    'quantity' => $i->quantity,
                    'unit_price' => $i->unit_price,
                    'total' => $i->total,
                ]),
                'payments' => $order->payments->map(fn (Payment $p) => [
                    'id' => $p->id,
                    'status' => $p->status->value,
                    'amount' => $p->amount,
                    'provider_payment_id' => $p->provider_payment_id,
                ]),
            ],
        ]);
    }

    public function invoices(Request $request): JsonResponse
    {
        $query = Invoice::with('user:id,first_name,last_name,email');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $invoices = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $invoices->getCollection()->map(fn (Invoice $inv) => [
                'id' => $inv->id,
                'number' => $inv->number,
                'user' => $inv->user?->full_name,
                'total' => $inv->total,
                'currency' => $inv->currency,
                'status' => $inv->status->value,
                'provider' => $inv->provider,
                'issued_at' => $inv->issued_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function webhookEvents(Request $request): JsonResponse
    {
        $query = WebhookEvent::query();

        if ($provider = $request->query('provider')) {
            $query->where('provider', $provider);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $events = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $events->getCollection()->map(fn (WebhookEvent $e) => [
                'id' => $e->id,
                'provider' => $e->provider,
                'event_id' => $e->event_id,
                'event_type' => $e->event_type,
                'status' => $e->status,
                'attempts' => $e->attempts,
                'error_message' => $e->error_message,
                'created_at' => $e->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function replayWebhook(
        WebhookEvent $webhookEvent,
        HandleWebhookAction $webhooks,
        ProcessWebhookEventAction $processor,
    ): JsonResponse {
        if ($webhookEvent->status === WebhookEvent::STATUS_PROCESSED) {
            return response()->json(['success' => false, 'message' => 'Event already processed.'], 422);
        }

        if (! $webhooks->claimExisting($webhookEvent)) {
            return response()->json([
                'success' => false,
                'message' => 'Webhook is already being processed. Try again after its claim lease expires.',
            ], 409);
        }

        $event = $webhookEvent->fresh();

        try {
            $processor->execute($event->provider, $event->event_type, $event->payload ?? []);
            $webhooks->markProcessed($event);
        } catch (\Throwable $e) {
            $webhooks->markFailed($event, $e->getMessage());

            return response()->json(['success' => false, 'message' => 'Webhook replay failed. See the stored error for details.'], 422);
        }

        return response()->json(['success' => true, 'message' => 'Webhook replayed.', 'data' => ['id' => $event->id]]);
    }

    public function failedPayments(): JsonResponse
    {
        $payments = Payment::with(['user:id,first_name,last_name,email', 'order:id,status'])
            ->where('status', 'failed')
            ->latest()
            ->paginate(15);

        return response()->json([
            'data' => $payments->getCollection()->map(fn (Payment $p) => [
                'id' => $p->id,
                'user' => $p->user?->full_name,
                'email' => $p->user?->email,
                'amount' => $p->amount,
                'currency' => $p->currency,
                'failure_code' => $p->failure_code,
                'failure_message' => $p->failure_message,
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

    public function refundPayment(Request $request, Payment $payment, \App\Services\Audit\AuditService $audit): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['sometimes', 'integer', 'min:1'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'idempotency_key' => ['sometimes', 'string', 'max:120'],
        ]);

        $amount = $data['amount'] ?? $payment->refundableAmount();
        $payment = app(\App\Domains\Payments\Services\PaymentService::class)->refund(
            $payment,
            $amount,
            $data['reason'] ?? 'Admin refund',
            $data['idempotency_key'] ?? null,
        );
        $audit->log('payment.refunded', $payment, [], ['amount' => $amount, 'reason' => $data['reason'] ?? null]);

        return response()->json([
            'success' => true,
            'message' => $payment->status === PaymentStatus::REFUNDED ? 'Payment refunded.' : 'Partial refund processed.',
            'data' => ['id' => $payment->id, 'status' => $payment->status->value],
        ]);
    }
}
