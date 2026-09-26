<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Payments\Actions\ConfirmTransactionAction;
use App\Domains\Payments\Actions\RefundTransactionAction;
use App\Domains\Payments\Enums\PayoutStatus;
use App\Domains\Payments\Enums\SubscriptionStatus;
use App\Domains\Payments\Enums\TransactionStatus;
use App\Domains\Payments\Enums\TransactionType;
use App\Domains\Payments\Models\Payout;
use App\Domains\Payments\Models\Refund;
use App\Domains\Payments\Models\Subscription;
use App\Domains\Payments\Models\Transaction;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCommerceController extends Controller
{
    public function overview(): JsonResponse
    {
        try {
            $hasPayments = \Illuminate\Support\Facades\Schema::hasTable('payments');
            $hasOrders = \Illuminate\Support\Facades\Schema::hasTable('orders');

            if ($hasPayments) {
                $gross = (int) \App\Domains\Payments\Models\Payment::where('status', \App\Domains\Payments\Enums\PaymentStatus::SUCCEEDED->value)->sum('amount');
                $refunded = (int) \App\Domains\Payments\Models\Payment::whereIn('status', [\App\Domains\Payments\Enums\PaymentStatus::REFUNDED->value, \App\Domains\Payments\Enums\PaymentStatus::PARTIALLY_REFUNDED->value])->sum('amount');
                $purchases = $hasOrders ? \App\Domains\Payments\Models\Order::where('status', 'paid')->count() : \App\Domains\Payments\Models\Payment::where('status', \App\Domains\Payments\Enums\PaymentStatus::SUCCEEDED->value)->count();
                $pending = \App\Domains\Payments\Models\Payment::where('status', \App\Domains\Payments\Enums\PaymentStatus::PENDING->value)->count();
                $failed = \App\Domains\Payments\Models\Payment::where('status', \App\Domains\Payments\Enums\PaymentStatus::FAILED->value)->count();
                $since = now()->subDays(13)->startOfDay();
                $daily = \App\Domains\Payments\Models\Payment::where('status', \App\Domains\Payments\Enums\PaymentStatus::SUCCEEDED->value)->where('created_at', '>=', $since)->get(['amount', 'created_at']);
                $recent = \App\Domains\Payments\Models\Payment::with(['user:id,first_name,last_name', 'order:id,status'])->latest()->limit(5)->get()->map(fn (\App\Domains\Payments\Models\Payment $p) => [
                    'id' => $p->id,
                    'user' => $p->user?->full_name,
                    'email' => $p->user?->email,
                    'course' => $p->order?->id ? 'Order '.$p->order->id : null,
                    'kind' => $p->payment_method_type->value ?? 'card',
                    'status' => $p->status->value,
                    'amount' => $p->amount,
                    'currency' => $p->currency,
                    'provider' => $p->provider->value,
                    'provider_ref' => $p->provider_payment_id,
                    'created_at' => $p->created_at?->toISOString(),
                ]);
            } else {
                $succeeded = Transaction::query()->where('status', TransactionStatus::SUCCEEDED->value);
                $gross = (int) (clone $succeeded)->sum('amount');
                $refunded = (int) Transaction::query()->where('status', TransactionStatus::REFUNDED->value)->sum('amount');
                $purchases = 0;
                $pending = Transaction::query()->where('status', TransactionStatus::PENDING->value)->count();
                $failed = Transaction::query()->where('status', TransactionStatus::FAILED->value)->count();
                $since = now()->subDays(13)->startOfDay();
                $daily = Transaction::query()->where('status', TransactionStatus::SUCCEEDED->value)->where('created_at', '>=', $since)->get(['amount', 'created_at']);
                $recent = Transaction::query()->with(['user:id,first_name,last_name', 'course:id,title'])->latest()->limit(5)->get()->map(fn (Transaction $t) => $this->serializeTransaction($t));
            }

            $buckets = [];
            for ($i = 0; $i < 14; $i++) {
                $buckets[now()->subDays(13 - $i)->toDateString()] = 0;
            }
            foreach ($daily as $row) {
                $date = $row->created_at->toDateString();
                if (array_key_exists($date, $buckets)) {
                    $buckets[$date] += (int) $row->amount;
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Commerce overview retrieved.',
                'data' => [
                    'gross_revenue' => (int) $gross,
                    'refunded' => (int) $refunded,
                    'net_revenue' => (int) ($gross - $refunded),
                    'currency' => config('app.currency', 'DZD'),
                    'purchases' => $purchases,
                    'pending_transactions' => $pending,
                    'failed_transactions' => $failed,
                    'active_subscriptions' => \Illuminate\Support\Facades\Schema::hasTable('subscriptions') ? \App\Domains\Payments\Models\Subscription::query()->whereIn('status', [\App\Domains\Payments\Enums\SubscriptionStatus::TRIAL->value, \App\Domains\Payments\Enums\SubscriptionStatus::ACTIVE->value])->count() : 0,
                    'revenue_14d' => array_map(fn (string $date, int $total) => ['date' => $date, 'total' => $total], array_keys($buckets), array_values($buckets)),
                    'recent_transactions' => $recent,
                ],
            ]);
        } catch (\Throwable $e) {
            \Log::warning('AdminCommerceController::overview failed', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => true,
                'message' => 'Commerce overview retrieved (degraded).',
                'data' => [
                    'gross_revenue' => 0,
                    'refunded' => 0,
                    'net_revenue' => 0,
                    'currency' => config('app.currency', 'DZD'),
                    'purchases' => 0,
                    'pending_transactions' => 0,
                    'failed_transactions' => 0,
                    'active_subscriptions' => 0,
                    'revenue_14d' => [],
                    'recent_transactions' => [],
                ],
            ]);
        }
    }

    public function transactions(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $type = $request->query('type');

        $query = Transaction::query()->with(['user:id,first_name,last_name,email', 'course:id,title']);

        if (in_array($status, ['pending', 'succeeded', 'failed', 'refunded', 'disputed'], true)) {
            $query->where('status', $status);
        }
        if (in_array($type, ['purchase', 'subscription', 'renewal'], true)) {
            $query->where('type', $type);
        }

        $transactions = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $transactions->getCollection()->map(fn (Transaction $transaction) => $this->serializeTransaction($transaction)),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function showTransaction(Transaction $transaction): JsonResponse
    {
        $transaction->load(['user:id,first_name,last_name,email', 'course:id,title', 'subscription:id,status']);

        return response()->json([
            'success' => true,
            'message' => 'Transaction retrieved.',
            'data' => $this->serializeTransaction($transaction, true),
        ]);
    }

    public function confirmTransaction(Transaction $transaction, ConfirmTransactionAction $confirm, AuditService $audit): JsonResponse
    {
        $result = $confirm->execute($transaction);

        $audit->log('transaction.confirmed', $result, ['status' => 'pending'], ['status' => 'succeeded']);

        return response()->json([
            'success' => true,
            'message' => 'Transaction confirmed and access granted.',
            'data' => ['id' => $result->id],
        ]);
    }

    public function failTransaction(Request $request, Transaction $transaction, AuditService $audit): JsonResponse
    {
        abort_unless($transaction->status === TransactionStatus::PENDING, 422, 'Only pending transactions can be marked as failed.');

        $data = $request->validate(['reason' => ['nullable', 'string', 'max:1000']]);

        $transaction->update(['status' => TransactionStatus::FAILED->value]);

        $audit->log('transaction.failed', $transaction, ['status' => 'pending'], ['status' => 'failed'], ['reason' => $data['reason'] ?? null]);

        return response()->json([
            'success' => true,
            'message' => 'Transaction marked as failed.',
            'data' => ['id' => $transaction->id],
        ]);
    }

    public function refund(Request $request, Transaction $transaction, RefundTransactionAction $refund, AuditService $audit): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:1000']]);

        $record = $refund->execute($transaction, (int) $request->user()->id, $data['reason'] ?? null);

        $audit->log('transaction.refunded', $transaction, ['status' => 'succeeded'], ['status' => 'refunded'], ['reason' => $data['reason'] ?? null]);

        return response()->json([
            'success' => true,
            'message' => 'Transaction refunded.',
            'data' => ['id' => $record->id],
        ]);
    }

    public function refunds(): JsonResponse
    {
        $refunds = Refund::query()
            ->with(['user:id,first_name,last_name,email', 'transaction:id,amount,currency'])
            ->latest()
            ->paginate(15);

        return response()->json([
            'data' => $refunds->getCollection()->map(fn (Refund $refund) => [
                'id' => $refund->id,
                'user' => $refund->user?->full_name,
                'email' => $refund->user?->email,
                'amount' => $refund->amount,
                'currency' => $refund->currency,
                'reason' => $refund->reason,
                'status' => $refund->status->value,
                'created_at' => $refund->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $refunds->currentPage(),
                'last_page' => $refunds->lastPage(),
                'per_page' => $refunds->perPage(),
                'total' => $refunds->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function subscriptions(Request $request): JsonResponse
    {
        $status = $request->query('status');

        $query = Subscription::query()->with(['user:id,first_name,last_name,email', 'plan:id,name,price,currency']);

        if ($status) {
            $query->where('status', $status);
        }

        $subscriptions = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $subscriptions->getCollection()->map(fn (Subscription $subscription) => [
                'id' => $subscription->id,
                'user' => $subscription->user?->full_name,
                'email' => $subscription->user?->email,
                'plan' => $subscription->plan?->name,
                'status' => $subscription->status->value,
                'current_period_ends_at' => $subscription->current_period_ends_at?->toISOString(),
                'created_at' => $subscription->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $subscriptions->currentPage(),
                'last_page' => $subscriptions->lastPage(),
                'per_page' => $subscriptions->perPage(),
                'total' => $subscriptions->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function cancelSubscription(Subscription $subscription, AuditService $audit): JsonResponse
    {
        abort_if(
            in_array($subscription->status, [SubscriptionStatus::CANCELLED, SubscriptionStatus::EXPIRED], true),
            422,
            'This subscription is already closed.',
        );

        $subscription->update([
            'status' => SubscriptionStatus::CANCELLED->value,
            'cancelled_at' => now(),
        ]);

        $audit->log('subscription.cancelled', $subscription, [], ['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription cancelled.',
            'data' => ['id' => $subscription->id],
        ]);
    }

    public function grantSubscription(Request $request, AuditService $audit): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'uuid', 'exists:users,uuid'],
            'plan_id' => ['required', 'uuid', 'exists:plans,id'],
        ]);

        $user = User::where('uuid', $data['user_id'])->firstOrFail();

        $subscription = Subscription::create([
            'user_id' => $user->id,
            'plan_id' => $data['plan_id'],
            'provider' => 'manual',
            'status' => SubscriptionStatus::ACTIVE->value,
            'current_period_ends_at' => now()->addMonth(),
        ]);

        $audit->log('subscription.granted', $subscription, [], ['user' => $user->email, 'status' => 'active']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription granted.',
            'data' => ['id' => $subscription->id],
        ], 201);
    }

    public function payouts(): JsonResponse
    {
        $payouts = Payout::query()
            ->with('instructor:id,first_name,last_name,email')
            ->latest()
            ->paginate(15);

        return response()->json([
            'data' => $payouts->getCollection()->map(fn (Payout $payout) => [
                'id' => $payout->id,
                'instructor' => $payout->instructor?->full_name,
                'email' => $payout->instructor?->email,
                'amount' => $payout->amount,
                'currency' => $payout->currency,
                'period' => $payout->period,
                'status' => $payout->status->value,
                'note' => $payout->note,
                'paid_at' => $payout->paid_at?->toISOString(),
                'created_at' => $payout->created_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $payouts->currentPage(),
                'last_page' => $payouts->lastPage(),
                'per_page' => $payouts->perPage(),
                'total' => $payouts->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function recordPayout(Request $request, AuditService $audit): JsonResponse
    {
        $data = $request->validate([
            'instructor_id' => ['required', 'uuid', 'exists:users,uuid'],
            'amount' => ['required', 'integer', 'min:1'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'period' => ['nullable', 'string', 'max:20'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $instructor = User::where('uuid', $data['instructor_id'])->firstOrFail();
        abort_unless($instructor->hasRole(UserRole::INSTRUCTOR->value), 422, 'Payouts can only target instructors.');

        $payout = Payout::create([
            'instructor_id' => $instructor->id,
            'amount' => $data['amount'],
            'currency' => $data['currency'] ?? config('app.currency', 'DZD'),
            'period' => $data['period'] ?? null,
            'status' => PayoutStatus::PENDING->value,
            'note' => $data['note'] ?? null,
            'processed_by' => $request->user()->id,
        ]);

        $audit->log('payout.recorded', $payout, [], ['amount' => $payout->amount, 'instructor' => $instructor->email]);

        return response()->json([
            'success' => true,
            'message' => 'Payout recorded.',
            'data' => ['id' => $payout->id],
        ], 201);
    }

    public function markPayoutPaid(Payout $payout, AuditService $audit): JsonResponse
    {
        abort_unless($payout->status === PayoutStatus::PENDING, 422, 'Only pending payouts can be marked as paid.');

        $payout->update(['status' => PayoutStatus::PAID->value, 'paid_at' => now()]);

        $audit->log('payout.paid', $payout, ['status' => 'pending'], ['status' => 'paid']);

        return response()->json([
            'success' => true,
            'message' => 'Payout marked as paid.',
            'data' => ['id' => $payout->id],
        ]);
    }

    public function autoGeneratePayouts(Request $request, \App\Domains\Payments\Services\InstructorPayoutAutomationService $automation, AuditService $audit): JsonResponse
    {
        $data = $request->validate(['period' => ['sometimes', 'string', 'regex:/^\d{4}-\d{2}$/']]);

        $payouts = $automation->generateForPeriod($data['period'] ?? null);

        if (count($payouts) > 0) {
            $audit->log('payouts.auto_generated', $payouts[0], [], ['count' => count($payouts), 'period' => $data['period'] ?? now()->format('Y-m')]);
        }

        return response()->json([
            'success' => true,
            'message' => count($payouts) ? count($payouts).' payout(s) generated.' : 'No eligible revenue to payout.',
            'data' => array_map(fn (Payout $p) => ['id' => $p->id, 'instructor' => $p->instructor?->full_name, 'amount' => $p->amount], $payouts),
        ]);
    }

    private function serializeTransaction(Transaction $transaction, bool $verbose = false): array
    {
        $payload = [
            'id' => $transaction->id,
            'user' => $transaction->user?->full_name,
            'email' => $transaction->user?->email,
            'course' => $transaction->course?->title,
            'kind' => $transaction->type instanceof \BackedEnum ? $transaction->type->value : (string) $transaction->type,
            'status' => $transaction->status instanceof \BackedEnum ? $transaction->status->value : (string) $transaction->status,
            'amount' => $transaction->amount,
            'currency' => $transaction->currency,
            'provider' => $transaction->provider,
            'provider_ref' => $transaction->provider_ref,
            'created_at' => $transaction->created_at?->toISOString(),
        ];

        if ($verbose) {
            $payload['metadata'] = $transaction->metadata;
            $payload['confirmed_at'] = $transaction->confirmed_at?->toISOString();
        }

        return $payload;
    }
}
