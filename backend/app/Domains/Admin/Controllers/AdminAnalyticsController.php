<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Admin\Queries\AdminAnalyticsQuery;
use App\Domains\Admin\Queries\AdminDashboardQuery;
use App\Domains\Admin\Resources\AdminAnalyticsResource;
use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

final class AdminAnalyticsController extends Controller
{
    public function overview(Request $request): AdminAnalyticsResource
    {
        return new AdminAnalyticsResource([
            'statistics' => AdminDashboardQuery::for($request->user())->overview()['statistics'],
        ]);
    }

    public function users(Request $request): AdminAnalyticsResource
    {
        return new AdminAnalyticsResource($this->query($request)->users());
    }

    public function courses(Request $request): AdminAnalyticsResource
    {
        return new AdminAnalyticsResource($this->query($request)->courses());
    }

    public function enrollments(Request $request): AdminAnalyticsResource
    {
        return new AdminAnalyticsResource($this->query($request)->enrollments());
    }

    public function learning(Request $request): AdminAnalyticsResource
    {
        return new AdminAnalyticsResource($this->query($request)->learning());
    }

    private function query(Request $request): AdminAnalyticsQuery
    {
        $data = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        $from = isset($data['date_from'])
            ? CarbonImmutable::parse($data['date_from'])->startOfDay()
            : now()->toImmutable()->subDays(29)->startOfDay();
        $to = isset($data['date_to'])
            ? CarbonImmutable::parse($data['date_to'])->endOfDay()
            : now()->toImmutable()->endOfDay();

        abort_if($from->diffInDays($to) > 365, 422, 'The analytics range cannot exceed 365 days.');

        return AdminAnalyticsQuery::between($from, $to);
    }
}
