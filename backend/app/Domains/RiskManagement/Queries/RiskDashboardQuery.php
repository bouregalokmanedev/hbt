<?php

namespace App\Domains\RiskManagement\Queries;

use App\Domains\RiskManagement\Models\Risk;
use App\Domains\RiskManagement\Models\RiskControl;
use App\Domains\Security\Models\RiskSignal;

class RiskDashboardQuery
{
    public function overview(): array
    {
        $byLevel = [
            'critical' => Risk::where('level', 'critical')->where('status', '!=', 'closed')->count(),
            'high' => Risk::where('level', 'high')->where('status', '!=', 'closed')->count(),
            'medium' => Risk::where('level', 'medium')->where('status', '!=', 'closed')->count(),
            'low' => Risk::where('level', 'low')->where('status', '!=', 'closed')->count(),
        ];
        $open = Risk::where('status', 'open')->count();

        return [
            'by_level' => $byLevel,
            'by_status' => ['open' => $open],
            'overdue_reviews' => Risk::whereNotNull('next_review_at')->where('next_review_at', '<', now())->count(),
            'failed_controls' => RiskControl::where('status', 'failed')->count(),
            'critical' => $byLevel['critical'],
            'high' => $byLevel['high'],
            'medium' => $byLevel['medium'],
            'low' => $byLevel['low'],
            'open' => $open,
            'recent_signals' => RiskSignal::latest()->limit(5)->get(['type', 'severity', 'score', 'created_at'])->toArray(),
            'by_category' => Risk::selectRaw('risk_categories.name as category, COUNT(*) as total')
                ->leftJoin('risk_categories', 'risk_categories.id', '=', 'risks.category_id')
                ->groupBy('risk_categories.name')
                ->pluck('total', 'category')
                ->all(),
        ];
    }
}
