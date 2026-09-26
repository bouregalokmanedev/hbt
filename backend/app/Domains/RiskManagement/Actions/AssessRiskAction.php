<?php

namespace App\Domains\RiskManagement\Actions;

use App\Domains\RiskManagement\Models\Risk;
use App\Domains\RiskManagement\Services\RiskScoringService;

class AssessRiskAction
{
    public function __construct(private RiskScoringService $scoring) {}

    public function execute(Risk $risk, int $probability, int $impact, ?int $assessorId, ?string $notes = null): Risk
    {
        $assessed = $this->scoring->assess($probability, $impact);

        $risk->assessments()->create([
            'assessor_id' => $assessorId,
            'probability' => $probability,
            'impact' => $impact,
            'score' => $assessed['score'],
            'level' => $assessed['level']->value,
            'notes' => $notes,
        ]);

        $risk->update([
            'probability' => $probability,
            'impact' => $impact,
            'score' => $assessed['score'],
            'level' => $assessed['level']->value,
            'status' => 'assessed',
            'next_review_at' => now()->addDays(30),
        ]);

        return $risk->fresh();
    }
}
