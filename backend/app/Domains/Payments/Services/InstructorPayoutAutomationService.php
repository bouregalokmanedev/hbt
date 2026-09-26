<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\Models\Payout;
use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class InstructorPayoutAutomationService
{
    /**
     * Accrue eligible revenue per instructor since last payout, create pending payouts.
     *
     * Platform fee is 30% by default — instructor gets 70%. Adjust via config.
     *
     * @return list<Payout>
     */
    public function generateForPeriod(?string $period = null): array
    {
        $period = $period ?? now()->format('Y-m');
        $share = (float) config('payments.instructor_share', 0.7);

        $instructorIds = Course::whereNotNull('instructor_id')->distinct()->pluck('instructor_id');

        $created = [];

        foreach ($instructorIds as $instructorId) {
            $courseIds = Course::where('instructor_id', $instructorId)->pluck('id');
            if ($courseIds->isEmpty()) {
                continue;
            }

            // Already paid for this period?
            $exists = Payout::where('instructor_id', $instructorId)->where('period', $period)->exists();
            if ($exists) {
                continue;
            }

            $lastPayoutAt = Payout::where('instructor_id', $instructorId)
                ->where('status', 'paid')
                ->max('paid_at') ?? now()->subYear();

            // Canonical orders
            $gross = 0;
            if (\Schema::hasTable('orders')) {
                $gross += (int) \DB::table('order_items')
                    ->join('orders', 'orders.id', '=', 'order_items.order_id')
                    ->whereIn('order_items.purchasable_id', $courseIds)
                    ->where('order_items.purchasable_type', Course::class)
                    ->where('orders.status', 'paid')
                    ->where('orders.paid_at', '>', $lastPayoutAt)
                    ->sum('order_items.total');
            }

            // Legacy fallback
            if ($gross === 0 && \Schema::hasTable('purchases')) {
                $gross += (int) \DB::table('purchases')
                    ->whereIn('course_id', $courseIds)
                    ->where('status', 'completed')
                    ->where('created_at', '>', $lastPayoutAt)
                    ->sum('amount');
            }

            if ($gross <= 0) {
                continue;
            }

            $amount = (int) round($gross * $share);

            $created[] = Payout::create([
                'instructor_id' => $instructorId,
                'amount' => $amount,
                'currency' => config('app.currency', 'DZD'),
                'period' => $period,
                'status' => 'pending',
                'note' => "Auto-generated for {$period} — gross {$gross}, share ".(int)($share*100)."%",
                'processed_by' => auth()->id(),
            ]);
        }

        return $created;
    }
}
