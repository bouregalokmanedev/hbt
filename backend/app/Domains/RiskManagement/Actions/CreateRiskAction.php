<?php

namespace App\Domains\RiskManagement\Actions;

use App\Domains\RiskManagement\Models\Risk;
use App\Domains\RiskManagement\Services\RiskScoringService;

class CreateRiskAction
{
    public function __construct(private RiskScoringService $scoring) {}

    /**
     * @param array<string,mixed> $data
     */
    public function execute(array $data, ?string $tenantId = null): Risk
    {
        $assessed = $this->scoring->assess((int) $data['probability'], (int) $data['impact']);

        return Risk::create([
            'tenant_id' => $tenantId,
            'category_id' => $data['category_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'status' => 'open',
            'level' => $assessed['level']->value,
            'probability' => $data['probability'],
            'impact' => $data['impact'],
            'score' => $assessed['score'],
            'owner_id' => $data['owner_id'] ?? null,
            'next_review_at' => now()->addDays(30),
            'metadata' => $data['metadata'] ?? null,
        ]);
    }
}
