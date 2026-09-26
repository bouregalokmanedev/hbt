<?php

namespace App\Domains\RiskManagement\Actions;

use App\Domains\RiskManagement\Models\SecurityIncident;

class CreateSecurityIncidentAction
{
    /**
     * @param array<string,mixed> $data
     */
    public function execute(array $data, ?int $reporterId = null, ?string $tenantId = null): SecurityIncident
    {
        $incident = SecurityIncident::create([
            'tenant_id' => $tenantId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'] ?? 'security',
            'severity' => $data['severity'] ?? 'medium',
            'status' => 'open',
            'reported_by' => $reporterId,
            'source_type' => $data['source_type'] ?? null,
            'source_id' => $data['source_id'] ?? null,
            'impact' => $data['impact'] ?? null,
            'metadata' => $data['metadata'] ?? null,
        ]);

        $incident->events()->create([
            'user_id' => $reporterId,
            'event' => 'created',
            'description' => 'Incident reported',
        ]);

        return $incident;
    }
}
