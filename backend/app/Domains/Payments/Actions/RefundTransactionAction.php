<?php

namespace App\Domains\Payments\Actions;

use App\Domains\Enrollments\Actions\CancelEnrollmentAction;
use App\Domains\Payments\Enums\PurchaseStatus;
use App\Domains\Payments\Enums\RefundStatus;
use App\Domains\Payments\Enums\SubscriptionStatus;
use App\Domains\Payments\Enums\TransactionStatus;
use App\Domains\Payments\Enums\TransactionType;
use App\Domains\Payments\Models\Plan;
use App\Domains\Payments\Models\Purchase;
use App\Domains\Payments\Models\Refund;
use App\Domains\Payments\Models\Subscription;
use App\Domains\Payments\Models\Transaction;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class RefundTransactionAction
{
    public function execute(Transaction $transaction, int $processedBy, ?string $reason = null): Refund
    {
        return DB::transaction(function () use ($transaction, $processedBy, $reason) {
            abort_unless($transaction->status === TransactionStatus::SUCCEEDED, 422, 'Only successful transactions can be refunded.');

            $refund = Refund::create([
                'transaction_id' => $transaction->id,
                'user_id' => $transaction->user_id,
                'amount' => $transaction->amount,
                'currency' => $transaction->currency,
                'reason' => $reason,
                'status' => RefundStatus::COMPLETED->value,
                'processed_by' => $processedBy,
            ]);

            $transaction->update(['status' => TransactionStatus::REFUNDED->value]);

            $purchase = Purchase::query()->where('transaction_id', $transaction->id)->first();
            if ($purchase) {
                $purchase->update([
                    'status' => PurchaseStatus::REFUNDED->value,
                    'refunded_at' => now(),
                ]);

                $enrollment = Enrollment::query()
                    ->where('user_id', $purchase->user_id)
                    ->where('course_id', $purchase->course_id)
                    ->first();
                if ($enrollment) {
                    try {
                        app(CancelEnrollmentAction::class)->execute($enrollment);
                    } catch (\Throwable) {
                        // Enrollment already closed; refund still stands.
                    }
                }
            }

            if ($transaction->subscription_id) {
                Subscription::query()->whereKey($transaction->subscription_id)->update([
                    'status' => SubscriptionStatus::CANCELLED->value,
                    'cancelled_at' => now(),
                ]);
            }

            return $refund;
        });
    }
}
