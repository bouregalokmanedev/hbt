<?php

namespace App\Domains\Payments\Services;

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

class PaymentAccessService
{
    /**
     * Central access decision: does this user own access to this course?
     *
     * Checks, in order: free course, active enrollment, successful purchase
     * (legacy Sprint 7), canonical succeeded payment via order item,
     * active subscription entitlement.
     */
    public function canAccessCourse(User $user, Course $course): bool
    {
        if ($course->is_free) {
            return true;
        }

        if (Enrollment::query()->where('user_id', $user->id)->where('course_id', $course->id)->exists()) {
            return true;
        }

        // Legacy Sprint 7 purchases
        if (\Schema::hasTable('purchases')) {
            $legacy = \App\Domains\Payments\Models\Purchase::query()
                ->where('user_id', $user->id)
                ->where('course_id', $course->id)
                ->where('status', 'completed')
                ->exists();
            if ($legacy) {
                return true;
            }
        }

        // Canonical orders → payments
        if (\Schema::hasTable('orders') && \Schema::hasTable('payments')) {
            $hasPaidOrder = \App\Domains\Payments\Models\Order::query()
                ->where('user_id', $user->id)
                ->where('status', 'paid')
                ->whereHas('items', function ($query) use ($course) {
                    $query->where('purchasable_type', Course::class)
                        ->where('purchasable_id', $course->id);
                })
                ->exists();
            if ($hasPaidOrder) {
                return true;
            }
        }

        // Active subscription check (when subscription domain is live)
        if (\Schema::hasTable('subscriptions')) {
            $active = \App\Domains\Payments\Models\Subscription::query()
                ->where('user_id', $user->id)
                ->whereIn('status', ['trial', 'active', 'past_due'])
                ->exists();
            if ($active) {
                return true;
            }
        }

        return false;
    }
}
