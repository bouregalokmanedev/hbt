<?php

namespace App\Domains\RiskManagement\Queries;

use App\Domains\RiskManagement\Models\Risk;
use App\Domains\RiskManagement\Models\RiskControl;
use App\Domains\Security\Models\RiskSignal;

class RiskReportQuery
{
    public function dashboard(): array
    {
        $base = Risk::query();

        return [
            'by_level' => [
                'critical' => (clone $base)->where('level', 'critical')->where('status', '!=', 'closed')->count(),
                'high' => (clone $base)->where('level', 'high')->where('status', '!=', 'closed')->count(),
                'medium' => (clone $base)->where('level', 'medium')->where('status', '!=', 'closed')->count(),
                'low' => (clone $base)->where('level', 'low')->where('status', '!=', 'closed')->count(),
            ],
            'by_status' => [
                'open' => (clone $base)->where('status', 'open')->count(),
                'assessed' => (clone $base)->where('status', 'assessed')->count(),
                'mitigating' => (clone $base)->where('status', 'mitigating')->count(),
                'accepted' => (clone $base)->where('status', 'accepted')->count(),
                'closed' => (clone $base)->where('status', 'closed')->count(),
            ],
            'overdue_reviews' => (clone $base)->whereNotNull('next_review_at')->where('next_review_at', '<', now())->count(),
            'due_soon' => (clone $base)->whereBetween('next_review_at', [now(), now()->addDays(7)])->count(),
            'failed_controls' => RiskControl::where('status', 'failed')->count(),
            'open_incidents' => \App\Domains\RiskManagement\Models\SecurityIncident::whereIn('status', ['open', 'acknowledged', 'contained'])->count(),
            'recent_risks' => Risk::with('category:id,name')->latest()->limit(5)->get(['id', 'title', 'level', 'score', 'status'])->toArray(),
            'recent_signals' => RiskSignal::latest()->limit(5)->get(['type', 'severity', 'score', 'created_at'])->toArray(),
            'controls_effectiveness' => [
                'active' => RiskControl::where('status', 'active')->count(),
                'failed' => RiskControl::where('status', 'failed')->count(),
                'average_score' => round((float) RiskControl::whereNotNull('effectiveness_score')->avg('effectiveness_score'), 1),
            ],
        ];
    }

    public function overdueReviews(): array
    {
        return Risk::with(['category:id,name', 'owner:id,first_name,last_name'])
            ->whereNotNull('next_review_at')
            ->where('next_review_at', '<', now())
            ->where('status', '!=', 'closed')
            ->latest('next_review_at')
            ->limit(20)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'level' => $r->level,
                'next_review_at' => $r->next_review_at?->toISOString(),
                'owner' => $r->owner?->full_name,
            ])
            ->toArray();
    }

    public function failedControls(): array
    {
        return RiskControl::with('risk:id,title')
            ->where('status', 'failed')
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'risk' => $c->risk?->title,
                'effectiveness_score' => $c->effectiveness_score,
            ])
            ->toArray();
    }
}
