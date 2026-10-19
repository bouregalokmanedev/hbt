<?php

namespace App\Domains\Marketing\Controllers;

use App\Domains\Analytics\Models\AnalyticsEvent;
use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class AnalyticsController extends Controller
{
    /**
     * ISO-3166 country codes grouped into reporting regions. Unknown codes
     * fall back to "Other" so nothing is silently dropped.
     */
    private const REGIONS = [
        'North Africa' => ['DZ', 'MA', 'TN', 'LY', 'EG', 'SD', 'MR'],
        'West & Central Africa' => ['NG', 'GH', 'CI', 'SN', 'CM', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GN', 'CD', 'AO'],
        'East & Southern Africa' => ['KE', 'ET', 'TZ', 'UG', 'RW', 'ZA', 'ZM', 'ZW', 'MZ', 'MG'],
        'Middle East' => ['SA', 'AE', 'QA', 'KW', 'OM', 'JO', 'LB', 'IQ', 'IR', 'IL', 'YE', 'SY'],
        'Western Europe' => ['FR', 'BE', 'NL', 'DE', 'LU', 'AT', 'CH', 'GB', 'IE', 'MC', 'AD'],
        'Southern Europe' => ['ES', 'PT', 'IT', 'GR', 'MT', 'HR', 'SI', 'BA', 'ME', 'AL'],
        'Eastern Europe' => ['PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'RS', 'UA', 'MD', 'BY', 'LT', 'LV', 'EE'],
        'Northern Europe' => ['SE', 'NO', 'DK', 'FI', 'IS'],
        'North America' => ['US', 'CA', 'MX'],
        'South America' => ['BR', 'AR', 'CL', 'CO', 'PE', 'UY', 'EC', 'VE', 'BO', 'PY'],
        'South & Central Asia' => ['IN', 'PK', 'BD', 'LK', 'NP', 'KZ', 'UZ', 'AF'],
        'East & Southeast Asia' => ['CN', 'JP', 'KR', 'ID', 'TH', 'VN', 'MY', 'SG', 'PH', 'MM', 'KH', 'TW', 'HK'],
        'Oceania' => ['AU', 'NZ', 'FJ', 'PG'],
    ];

    public function overview(Request $request): JsonResponse
    {
        // 1 day … 1 year windows, matching the range pills on the page.
        $days = min(max($request->integer('days', 7), 1), 365);
        $since = now()->subDays($days);

        $visitors = AnalyticsEvent::query()
            ->where('created_at', '>=', $since)
            ->distinct('visitor_id')
            ->count('visitor_id');

        $topPages = AnalyticsEvent::query()
            ->select('page', DB::raw('COUNT(*) as views'), DB::raw('COUNT(DISTINCT visitor_id) as visitors'))
            ->where('event', 'page_view')
            ->whereNotNull('page')
            ->where('created_at', '>=', $since)
            ->groupBy('page')
            ->orderByDesc('views')
            ->take(10)
            ->get();

        $topClicks = AnalyticsEvent::query()
            ->select('page', DB::raw('COUNT(*) as clicks'), DB::raw('COUNT(DISTINCT visitor_id) as visitors'))
            ->where('event', 'cta_click')
            ->where('created_at', '>=', $since)
            ->groupBy('page')
            ->orderByDesc('clicks')
            ->take(10)
            ->get();

        $avgSeconds = (int) round((float) (AnalyticsEvent::query()
            ->where('event', 'time_on_page')
            ->where('created_at', '>=', $since)
            ->get(['properties'])
            ->map(fn ($event) => (int) ($event->properties['seconds'] ?? 0))
            ->filter(fn ($seconds) => $seconds > 0 && $seconds < 3600)
            ->avg() ?? 0));

        $countries = AnalyticsEvent::query()
            ->select('country', DB::raw('COUNT(*) as events'), DB::raw('COUNT(DISTINCT visitor_id) as visitors'))
            ->whereNotNull('country')
            ->where('created_at', '>=', $since)
            ->groupBy('country')
            ->orderByDesc('visitors')
            ->take(10)
            ->get();

        $languages = AnalyticsEvent::query()
            ->select('language', DB::raw('COUNT(*) as events'), DB::raw('COUNT(DISTINCT visitor_id) as visitors'))
            ->whereNotNull('language')
            ->where('created_at', '>=', $since)
            ->groupBy('language')
            ->orderByDesc('visitors')
            ->take(8)
            ->get();

        return response()->json([
            'data' => [
                'days' => $days,
                'visitors' => $visitors,
                'top_pages' => $topPages,
                'top_clicks' => $topClicks,
                'avg_seconds_on_page' => $avgSeconds,
                'countries' => $countries,
                'regions' => $this->regions($countries),
                'languages' => $languages,
                'funnel_stages' => $this->funnelStages($since),
            ],
        ]);
    }

    /**
     * Two-phase funnel: discovery pages first (landing, company, simulator,
     * contact), then the conversion chain. Every stage counts unique visitors
     * so step-to-step conversion never exceeds 100%.
     *
     * @return list<array{key: string, phase: string, label: string, value: int}>
     */
    private function funnelStages(Carbon $since): array
    {
        $stages = [];

        $discovery = [
            ['key' => 'landing', 'label' => 'Landing page views', 'page' => '/'],
            ['key' => 'company', 'label' => 'Company page views', 'page' => '/company%'],
            ['key' => 'simulator', 'label' => 'Simulator views', 'page' => '/simulator%'],
            ['key' => 'contact', 'label' => 'Contact page views', 'page' => '/contact%'],
        ];

        foreach ($discovery as $stage) {
            $stages[] = [
                'key' => $stage['key'],
                'phase' => 'discovery',
                'label' => $stage['label'],
                'value' => AnalyticsEvent::query()
                    ->where('event', 'page_view')
                    ->where('page', 'like', $stage['page'])
                    ->where('created_at', '>=', $since)
                    ->distinct('visitor_id')
                    ->count('visitor_id'),
            ];
        }

        $conversion = [
            ['key' => 'pricing', 'label' => 'Pricing views', 'event' => 'pricing_viewed'],
            ['key' => 'plan_cta', 'label' => 'Plan CTA clicks', 'event' => 'plan_cta_clicked'],
        ];

        foreach ($conversion as $stage) {
            $stages[] = [
                'key' => $stage['key'],
                'phase' => 'conversion',
                'label' => $stage['label'],
                'value' => AnalyticsEvent::query()
                    ->where('event', $stage['event'])
                    ->where('created_at', '>=', $since)
                    ->distinct('visitor_id')
                    ->count('visitor_id'),
            ];
        }

        $stages[] = [
            'key' => 'signups',
            'phase' => 'conversion',
            'label' => 'Signups',
            'value' => User::query()->where('created_at', '>=', $since)->count(),
        ];
        $stages[] = [
            'key' => 'enrollments',
            'phase' => 'conversion',
            'label' => 'Enrollments',
            'value' => Enrollment::query()->where('created_at', '>=', $since)->count(),
        ];

        return $stages;
    }

    /**
     * Roll the country breakdown up into reporting regions.
     *
     * @param  Collection<int, object{country: string|null, events: int, visitors: int}>  $countries
     * @return list<array{region: string, visitors: int, countries: int}>
     */
    private function regions(Collection $countries): array
    {
        $rolled = [];

        foreach ($countries as $row) {
            $region = $this->regionFor($row->country);
            $rolled[$region] ??= ['region' => $region, 'visitors' => 0, 'countries' => 0];
            $rolled[$region]['visitors'] += (int) $row->visitors;
            $rolled[$region]['countries'] += 1;
        }

        return collect($rolled)
            ->sortByDesc('visitors')
            ->values()
            ->all();
    }

    private function regionFor(?string $country): string
    {
        if ($country === null) {
            return 'Unknown';
        }

        foreach (self::REGIONS as $region => $codes) {
            if (in_array($country, $codes, true)) {
                return $region;
            }
        }

        return 'Other';
    }
}
