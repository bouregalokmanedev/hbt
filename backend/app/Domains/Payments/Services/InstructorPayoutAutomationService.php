<?php

namespace App\Domains\Payments\Services;

use App\Domains\Payments\Models\Payout;
use App\Models\Course;

class InstructorPayoutAutomationService
{
    public function __construct(
        private readonly InstructorRevenueService $revenue,
    ) {
    }

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

            // The period is the idempotency key: any existing row (pending,
            // paid or cancelled) blocks a second accrual for the same month.
            $exists = Payout::where('instructor_id', $instructorId)->where('period', $period)->exists();
            if ($exists) {
                continue;
            }

            $start = \Illuminate\Support\Carbon::createFromFormat('!Y-m', $period)->startOfMonth();
            $end = $start->copy()->endOfMonth();

            $totals = $this->revenue->totals((int) $instructorId, $start, $end);
            $gross = max(0, $totals['gross'] - $totals['refunds']);

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
