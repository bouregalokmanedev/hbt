<?php

namespace App\Domains\Marketing\Controllers;

use App\Domains\Analytics\Models\AnalyticsEvent;
use App\Domains\Marketing\Models\Discount;
use App\Domains\Payments\Models\Order;
use App\Enums\LeadStatus;
use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class DashboardController extends Controller
{
    public function overview(): JsonResponse
    {
        $todayRevenue = (int) Order::query()->where('status', 'paid')->whereDate('paid_at', today())->sum('total');
        $weekRevenue = (int) Order::query()->where('status', 'paid')->where('paid_at', '>=', now()->subDays(7))->sum('total');
        $prevWeekRevenue = (int) Order::query()
            ->where('status', 'paid')
            ->where('paid_at', '>=', now()->subDays(14))
            ->where('paid_at', '<', now()->subDays(7))
            ->sum('total');
        $pendingOrders = Order::query()->where('status', 'pending')->count();

        $signups7d = User::query()->where('created_at', '>=', now()->subDays(7))->count();
        $signupsPrev = User::query()
            ->where('created_at', '>=', now()->subDays(14))
            ->where('created_at', '<', now()->subDays(7))
            ->count();
        $enrollments7d = Enrollment::query()->where('created_at', '>=', now()->subDays(7))->count();
        $enrollmentsPrev = Enrollment::query()
            ->where('created_at', '>=', now()->subDays(14))
            ->where('created_at', '<', now()->subDays(7))
            ->count();
        $visitors7d = AnalyticsEvent::query()->where('created_at', '>=', now()->subDays(7))->distinct('visitor_id')->count('visitor_id');
        $visitorsPrev = AnalyticsEvent::query()
            ->where('created_at', '>=', now()->subDays(14))
            ->where('created_at', '<', now()->subDays(7))
            ->distinct('visitor_id')
            ->count('visitor_id');

        return response()->json([
            'data' => [
                'revenue_today' => $todayRevenue,
                'revenue_7d' => $weekRevenue,
                'revenue_prev_7d' => $prevWeekRevenue,
                'pending_orders' => $pendingOrders,
                'signups_7d' => $signups7d,
                'signups_prev_7d' => $signupsPrev,
                'enrollments_7d' => $enrollments7d,
                'enrollments_prev_7d' => $enrollmentsPrev,
                'published_courses' => Course::query()->where('status', 'published')->count(),
                'active_campaigns' => Discount::query()->where('active', true)->count(),
                'live_campaigns' => Discount::query()->get()->filter(fn (Discount $discount) => $discount->isLive())->count(),
                'referral_signups' => User::query()->whereNotNull('referred_by')->count(),
                'leads' => ContactMessage::query()->count(),
                'unread_leads' => ContactMessage::query()->whereNull('read_at')->count(),
                'visitors_7d' => $visitors7d,
                'visitors_prev_7d' => $visitorsPrev,
                'currency' => $this->dominantCurrency(),
                'revenue_series' => $this->dailySeries(
                    Order::query()
                        ->selectRaw('DATE(paid_at) AS day, SUM(total) AS value')
                        ->where('status', 'paid')
                        ->whereNotNull('paid_at')
                        ->where('paid_at', '>=', $this->seriesStart())
                        ->groupBy('day')
                        ->orderBy('day')
                        ->pluck('value', 'day')
                ),
                'signups_series' => $this->dailySeries(
                    User::query()
                        ->selectRaw('DATE(created_at) AS day, COUNT(*) AS value')
                        ->where('created_at', '>=', $this->seriesStart())
                        ->groupBy('day')
                        ->orderBy('day')
                        ->pluck('value', 'day')
                ),
                'funnel' => [
                    'visitors' => $visitors7d,
                    'course_views' => AnalyticsEvent::query()
                        ->where('event', 'page_view')
                        ->where('page', 'like', '/courses/%')
                        ->where('page', 'not like', '%/lessons/%')
                        ->where('created_at', '>=', now()->subDays(7))
                        ->distinct('visitor_id')
                        ->count('visitor_id'),
                    'signups' => $signups7d,
                    'enrollments' => $enrollments7d,
                    'paid_orders' => Order::query()->where('status', 'paid')->where('paid_at', '>=', now()->subDays(7))->count(),
                ],
                'activity' => $this->activity(),
                'pipeline' => $this->pipeline(),
                'top_countries' => AnalyticsEvent::query()
                    ->select('country', DB::raw('COUNT(*) as events'), DB::raw('COUNT(DISTINCT visitor_id) as visitors'))
                    ->whereNotNull('country')
                    ->where('created_at', '>=', now()->subDays(30))
                    ->groupBy('country')
                    ->orderByDesc('events')
                    ->take(6)
                    ->get(),
            ],
        ]);
    }

    /**
     * Pipeline snapshot for the sales home: stage counts, follow-up load
     * and a 30-day win rate so reps see the state of the board instantly.
     */
    private function pipeline(): array
    {
        $leads = fn () => ContactMessage::query();

        $byStage = ContactMessage::query()
            ->selectRaw('status, COUNT(*) AS total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->all();
        foreach (LeadStatus::pipeline() as $stage) {
            $byStage[$stage] = (int) ($byStage[$stage] ?? 0);
        }

        $won = (int) $leads()->where('status', LeadStatus::WON->value)
            ->where('closed_at', '>=', now()->subDays(30))
            ->count();
        $lost = (int) $leads()->where('status', LeadStatus::LOST->value)
            ->where('closed_at', '>=', now()->subDays(30))
            ->count();

        return [
            'by_stage' => $byStage,
            'due_today' => $leads()->due('today')->count(),
            'overdue' => $leads()->due('overdue')->count(),
            'hot' => $leads()->where('score', '>=', 70)
                ->whereNotIn('status', [LeadStatus::WON->value, LeadStatus::LOST->value])
                ->count(),
            'won_30d' => $won,
            'lost_30d' => $lost,
            'win_rate' => ($won + $lost) > 0 ? round($won / ($won + $lost) * 100) : null,
            'top_sources' => ContactMessage::query()
                ->selectRaw("COALESCE(source, 'unknown') AS source, COUNT(*) AS total")
                ->groupBy('source')
                ->orderByDesc('total')
                ->take(5)
                ->get(),
        ];
    }

    private function seriesStart(): Carbon
    {
        return now()->subDays(13)->startOfDay();
    }

    /**
     * Continuous 14-day series with zero-filled gaps so the sparkline never
     * silently skips a quiet day.
     *
     * @param  \Illuminate\Support\Collection<string, int|string>  $rows
     * @return list<array{date: string, value: int}>
     */
    private function dailySeries(Collection $rows): array
    {
        $series = [];
        for ($offset = 13; $offset >= 0; $offset--) {
            $date = now()->subDays($offset)->toDateString();
            $series[] = ['date' => $date, 'value' => (int) ($rows[$date] ?? 0)];
        }

        return $series;
    }

    private function dominantCurrency(): string
    {
        $counts = Order::query()
            ->where('status', 'paid')
            ->groupBy('currency')
            ->selectRaw('currency, COUNT(*) AS times')
            ->get(['currency', 'times']);

        return (string) ($counts->sortByDesc('times')->first()?->currency ?: config('app.currency'));
    }

    /**
     * Latest signups, leads and paid orders in one reverse-chronological
     * feed — the "what just happened" panel of the sales dashboard.
     *
     * @return list<array{type: string, title: string, subtitle: string, at: string}>
     */
    private function activity(): array
    {
        $rows = collect()
            ->merge(User::query()->latest('created_at')->take(5)->get()->map(fn (User $user) => [
                'type' => 'signup',
                'title' => trim($user->first_name.' '.$user->last_name) ?: (string) $user->email,
                'subtitle' => (string) $user->email,
                'at' => optional($user->created_at)->toIso8601String(),
            ]))
            ->merge(ContactMessage::query()->latest('created_at')->take(5)->get()->map(fn (ContactMessage $lead) => [
                'type' => 'lead',
                'title' => trim($lead->first_name.' '.$lead->last_name) ?: (string) ($lead->subject ?? 'Lead'),
                'subtitle' => (string) ($lead->subject ?? $lead->email),
                'at' => optional($lead->created_at)->toIso8601String(),
            ]))
            ->merge(Order::query()->where('status', 'paid')->latest('paid_at')->take(5)->get()->map(fn (Order $order) => [
                'type' => 'order',
                'title' => number_format($order->total / 100, 0, '.', ' ').' '.$order->currency,
                'subtitle' => 'Paid order',
                'at' => optional($order->paid_at ?? $order->created_at)->toIso8601String(),
            ]))
            ->filter(fn (array $row) => $row['at'] !== null)
            ->sortByDesc('at')
            ->take(8)
            ->values()
            ->all();

        return $rows;
    }
}
