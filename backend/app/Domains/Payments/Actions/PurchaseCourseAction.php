<?php

namespace App\Domains\Payments\Actions;

use App\Domains\Enrollments\Actions\CancelEnrollmentAction;
use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
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
use App\Domains\Payments\Providers\ManualPaymentProvider;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final readonly class PurchaseCourseAction
{
    public function execute(User $user, Course $course): Purchase
    {
        return DB::transaction(function () use ($user, $course) {
            $existing = Purchase::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->first();

            abort_if(
                $existing && in_array($existing->status, [PurchaseStatus::PENDING, PurchaseStatus::COMPLETED], true),
                422,
                'You already have an active purchase for this course.',
            );

            $amount = $course->is_free ? 0 : (int) ($course->discount_price ?? $course->price ?? 0);

            $transaction = Transaction::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'type' => TransactionType::PURCHASE->value,
                'status' => $amount === 0 ? TransactionStatus::SUCCEEDED->value : TransactionStatus::PENDING->value,
                'amount' => $amount,
                'currency' => $course->currency ?? 'DZD',
                'provider' => 'manual',
            ]);

            $purchase = Purchase::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'transaction_id' => $transaction->id,
                'amount' => $amount,
                'currency' => $transaction->currency,
                'status' => $amount === 0 ? PurchaseStatus::COMPLETED->value : PurchaseStatus::PENDING->value,
            ]);

            if ($amount === 0) {
                $transaction->update(['confirmed_at' => now()]);
                $this->grantEnrollment($user, $course);
            } else {
                app(ManualPaymentProvider::class)->initiate($transaction);
            }

            return $purchase->fresh();
        });
    }

    private function grantEnrollment(User $user, Course $course): void
    {
        $already = Enrollment::query()
            ->where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->exists();

        if (! $already) {
            app(CreateEnrollmentAction::class)->execute($user->id, $course);
        }
    }
}
