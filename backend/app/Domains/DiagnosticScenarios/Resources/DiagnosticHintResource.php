<?php

namespace App\Domains\DiagnosticScenarios\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class DiagnosticHintResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $revealed = (bool) $this->resource->getAttribute('revealed', false);

        return [
            'id' => $this->id,
            'step_id' => $this->diagnostic_scenario_step_id,
            'level' => $this->level,
            'title' => $this->title,
            // Content is only revealed after use; listing endpoints omit it.
            'content' => $this->when($revealed, $this->content),
            'penalty_points' => $this->penalty_points,
            'revealed' => $revealed,
        ];
    }
}
