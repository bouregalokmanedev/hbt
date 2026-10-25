<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Payments\Models\Payout;
use App\Domains\Payments\Services\InstructorRevenueService;
use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InstructorRevenueController extends Controller
{
    public function index(InstructorRevenueService $revenue): JsonResponse
    {
        $instructorId = (int) auth()->id();

        $totals = $revenue->totals($instructorId);

        $payouts = Payout::query()
            ->where('instructor_id', $instructorId)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'amount' => $p->amount,
                'currency' => $p->currency,
                'period' => $p->period,
                'status' => $p->status->value,
                'paid_at' => $p->paid_at?->toISOString(),
            ]);

        $perCourse = Course::query()
            ->where('instructor_id', $instructorId)
            ->get()
            ->map(function (Course $course) {
                $courseSales = 0;
                $courseRevenue = 0;

                if (Schema::hasTable('order_items')) {
                    $courseOrders = DB::table('order_items')
                        ->join('orders', 'orders.id', '=', 'order_items.order_id')
                        ->where('order_items.purchasable_id', $course->id)
                        ->where('order_items.purchasable_type', Course::class)
                        ->where('orders.status', 'paid');

                    $courseSales = (int) (clone $courseOrders)->distinct()->count('orders.id');
                    $courseRevenue = (int) (clone $courseOrders)->sum('order_items.total');
                }

                if (Schema::hasTable('purchases')) {
                    $legacySales = DB::table('purchases')
                        ->where('course_id', $course->id)
                        ->where('status', 'completed')
                        ->count();
                    $courseSales = max($courseSales, $legacySales);
                }

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'status' => $course->status->value,
                    'sales' => $courseSales,
                    'gross_revenue' => $courseRevenue,
                    'price' => $course->price,
                    'currency' => $course->currency,
                ];
            });

        $share = (float) config('payments.instructor_share', 0.7);
        $netAfterRefunds = max(0, $totals['gross'] - $totals['refunds']);

        return response()->json([
            'success' => true,
            'message' => 'Revenue overview retrieved.',
            'data' => [
                'gross_revenue' => $totals['gross'],
                'refunded' => $totals['refunds'],
                'instructor_share' => $share,
                'net_revenue' => (int) round($netAfterRefunds * $share),
                'currency' => config('app.currency', 'DZD'),
                'total_sales' => $totals['sales'],
                'refunds' => $totals['refund_count'],
                'courses' => $perCourse,
                'payouts' => $payouts,
                'pending_payout' => (int) $payouts->where('status', 'pending')->sum('amount'),
            ],
        ]);
    }
}
