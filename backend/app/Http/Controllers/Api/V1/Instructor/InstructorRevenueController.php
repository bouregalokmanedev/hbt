<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InstructorRevenueController extends Controller
{
    public function index(): JsonResponse
    {
        $instructorId = auth()->id();

        $courseIds = Course::where('instructor_id', $instructorId)->pluck('id');

        // Payout history for this instructor
        $payouts = \App\Domains\Payments\Models\Payout::where('instructor_id', $instructorId)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($p) => ['id' => $p->id, 'amount' => $p->amount, 'currency' => $p->currency, 'period' => $p->period, 'status' => $p->status->value, 'paid_at' => $p->paid_at?->toISOString()]);

        if ($courseIds->isEmpty()) {
            return response()->json([
                'success' => true,
                'message' => 'Revenue overview retrieved.',
                'data' => [
                    'gross_revenue' => 0,
                    'refunded' => 0,
                    'net_revenue' => 0,
                    'currency' => config('app.currency', 'DZD'),
                    'total_sales' => 0,
                    'refunds' => 0,
                    'courses' => [],
                ],
            ]);
        }

        $gross = 0;
        $refunded = 0;
        $sales = 0;

        if (Schema::hasTable('orders')) {
            $orders = \App\Domains\Payments\Models\Order::whereHas('items', fn ($q) => $q->whereIn('purchasable_id', $courseIds)->where('purchasable_type', Course::class))
                ->where('status', 'paid')
                ->get();
            $gross = $orders->sum('total');
            $sales = $orders->count();
        }

        if (Schema::hasTable('payments')) {
            $refunded = \App\Domains\Payments\Models\Payment::whereHas('order.items', fn ($q) => $q->whereIn('purchasable_id', $courseIds))
                ->whereIn('status', ['refunded', 'partially_refunded'])
                ->get()
                ->sum(function ($payment) {
                    return $payment->transactions()->whereIn('type', ['refund', 'partial_refund'])->sum('amount');
                });
        }

        // Fallback to legacy purchases if no canonical orders yet
        if ($gross === 0 && Schema::hasTable('purchases')) {
            $legacy = \App\Domains\Payments\Models\Purchase::whereIn('course_id', $courseIds)->where('status', 'completed');
            $gross = (clone $legacy)->sum('amount');
            $sales = (clone $legacy)->count();
            $refunded = \App\Domains\Payments\Models\Purchase::whereIn('course_id', $courseIds)->where('status', 'refunded')->sum('amount');
        }

        $perCourse = Course::where('instructor_id', $instructorId)
            ->get()
            ->map(function (Course $course) {
                $courseSales = 0;
                $courseRefunds = 0;
                if (\Schema::hasTable('order_items')) {
                    $courseSales = \DB::table('order_items')
                        ->join('orders', 'orders.id', '=', 'order_items.order_id')
                        ->where('order_items.purchasable_id', $course->id)
                        ->where('order_items.purchasable_type', Course::class)
                        ->where('orders.status', 'paid')
                        ->count();
                }
                if (\Schema::hasTable('purchases')) {
                    $legacySales = \App\Domains\Payments\Models\Purchase::where('course_id', $course->id)->where('status', 'completed')->count();
                    $courseSales = max($courseSales, $legacySales);
                }
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'status' => $course->status->value,
                    'sales' => $courseSales,
                    'price' => $course->price,
                    'currency' => $course->currency,
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Instructor revenue retrieved.',
            'data' => [
                'gross_revenue' => (int) $gross,
                'refunded' => (int) $refunded,
                'net_revenue' => (int) ($gross - $refunded),
                'currency' => config('app.currency', 'DZD'),
                'total_sales' => $sales,
                'refunds' => \App\Domains\Payments\Models\Payment::whereHas('order.items', fn ($q) => $q->whereIn('purchasable_id', $courseIds))->where('status', 'refunded')->count(),
                'courses' => $perCourse,
                'payouts' => $payouts,
                'pending_payout' => $payouts->where('status', 'pending')->sum('amount'),
            ],
        ]);
    }
}
