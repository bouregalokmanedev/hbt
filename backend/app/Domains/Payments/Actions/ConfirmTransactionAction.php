<?php

namespace App\Domains\Payments\Actions;

use App\Domains\Enrollments\Actions\CancelEnrollmentAction;
use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
use App\Domains\Payments\Enums\PurchaseStatus;
use App\Domains\Payments\Enums\RefundStatus;
use App\Domains\Payments\Enums\SubscriptionStatus;
use App\Domains\Payments\Enums\TransactionStatus;
use App\Domains\Payments\Models\Plan;
use App\Domains\Payments\Models\Purchase;
use App\Domains\Payments\Models\Refund;
use App\Domains\Payments\Models\Subscription;
use App\Domains\Payments\Models\Transaction;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class ConfirmTransactionAction
{
    public function execute(Transaction $transaction): Transaction
    {
        return DB::transaction(function () use ($transaction) {
            abort_unless($transaction->status === TransactionStatus::PENDING, 422, 'Only pending transactions can be confirmed.');

            $transaction->update([
                'status' => TransactionStatus::SUCCEEDED->value,
                'confirmed_at' => now(),
            ]);

            if ($transaction->course_id) {
                $purchase = Purchase::query()
                    ->where('transaction_id', $transaction->id)
                    ->first();

                if ($purchase) {
                    $purchase->update(['status' => PurchaseStatus::COMPLETED->value]);
                }

                $course = Course::query()->find($transaction->course_id);
                if ($course) {
                    $already = Enrollment::query()
                        ->where('user_id', $transaction->user_id)
                        ->where('course_id', $course->id)
                        ->exists();
                    if (! $already) {
                        app(CreateEnrollmentAction::class)->execute($transaction->user_id, $course);
                    }
                }
            }

            if ($transaction->subscription_id) {
                Subscription::query()->whereKey($transaction->subscription_id)->update([
                    'status' => SubscriptionStatus::ACTIVE->value,
                    'current_period_ends_at' => now()->addMonth(),
                ]);
            }

            return $transaction->fresh();
        });
    }
}
