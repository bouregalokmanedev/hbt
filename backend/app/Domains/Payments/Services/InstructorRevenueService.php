<?php

namespace App\Domains\Payments\Services;

use App\Models\Course;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class InstructorRevenueService
{
    /**
     * @return array{gross: int, refunds: int, refund_count: int, sales: int, course_ids: list<string>}
     */
    public function totals(
        int $instructorId,
        ?CarbonInterface $from = null,
        ?CarbonInterface $to = null,
    ): array {
        $courseIds = Course::query()
            ->where('instructor_id', $instructorId)
            ->pluck('id')
            ->all();

        if ($courseIds === []) {
            return [
                'gross' => 0,
                'refunds' => 0,
                'refund_count' => 0,
                'sales' => 0,
                'course_ids' => [],
            ];
        }

        $gross = 0;
        $sales = 0;
        $refunds = 0;
        $refundCount = 0;

        if (Schema::hasTable('orders') && Schema::hasTable('order_items')) {
            $orders = DB::table('order_items')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->whereIn('order_items.purchasable_id', $courseIds)
                ->where('order_items.purchasable_type', Course::class)
                ->where('orders.status', 'paid');

            if ($from !== null && $to !== null) {
                $orders->whereBetween('orders.paid_at', [$from, $to]);
            }

            $gross = (int) (clone $orders)->sum('order_items.total');
            $sales = (int) (clone $orders)->distinct()->count('orders.id');
        }

        if (
            Schema::hasTable('payment_transactions')
            && Schema::hasTable('payments')
            && Schema::hasTable('orders')
            && Schema::hasTable('order_items')
        ) {
            $refundRows = DB::table('payment_transactions')
                ->join('payments', 'payments.id', '=', 'payment_transactions.payment_id')
                ->join('orders', 'orders.id', '=', 'payments.order_id')
                ->whereIn('payment_transactions.type', ['refund', 'partial_refund'])
                ->whereIn('orders.id', function ($query) use ($courseIds) {
                    $query->select('order_id')
                        ->from('order_items')
                        ->whereIn('purchasable_id', $courseIds)
                        ->where('purchasable_type', Course::class);
                });

            if ($from !== null && $to !== null) {
                $refundRows->whereBetween('payment_transactions.created_at', [$from, $to]);
            }

            $refundRows = $refundRows
                ->select([
                    'payment_transactions.amount',
                    'payments.order_id',
                ])
                ->get();

            foreach ($refundRows->groupBy('order_id') as $orderId => $rows) {
                $orderSubtotal = (int) DB::table('orders')->where('id', $orderId)->value('subtotal');
                $instructorSubtotal = (int) DB::table('order_items')
                    ->where('order_id', $orderId)
                    ->whereIn('purchasable_id', $courseIds)
                    ->where('purchasable_type', Course::class)
                    ->sum('total');

                if ($orderSubtotal <= 0) {
                    continue;
                }

                $ratio = min(1, $instructorSubtotal / $orderSubtotal);
                $refunds += (int) round((int) $rows->sum('amount') * $ratio);
                $refundCount += $rows->count();
            }
        }

        if ($gross === 0 && Schema::hasTable('purchases')) {
            $legacy = DB::table('purchases')
                ->whereIn('course_id', $courseIds)
                ->where('status', 'completed');

            if ($from !== null && $to !== null) {
                $legacy->whereBetween('created_at', [$from, $to]);
            }

            $gross = (int) (clone $legacy)->sum('amount');
            $sales = (int) (clone $legacy)->count();

            $legacyRefunds = DB::table('purchases')
                ->whereIn('course_id', $courseIds)
                ->where('status', 'refunded');

            if ($from !== null && $to !== null) {
                $legacyRefunds->whereBetween('refunded_at', [$from, $to]);
            }

            $refunds = (int) $legacyRefunds->sum('amount');
            $refundCount = (int) $legacyRefunds->count();
        }

        return [
            'gross' => $gross,
            'refunds' => $refunds,
            'refund_count' => $refundCount,
            'sales' => $sales,
            'course_ids' => $courseIds,
        ];
    }
}
