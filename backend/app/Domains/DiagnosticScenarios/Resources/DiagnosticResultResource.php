<?php

namespace App\Domains\DiagnosticScenarios\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class DiagnosticResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'attempt_id' => $this->diagnostic_scenario_attempt_id,
            'scenario_id' => $this->diagnostic_scenario_id,
            'score' => $this->score,
            'accuracy' => $this->accuracy,
            'process_score' => $this->process_score,
            'points_earned' => $this->points_earned,
            'points_possible' => $this->points_possible,
            'passed' => $this->passed,
            'strengths' => $this->strengths ?? [],
            'weaknesses' => $this->weaknesses ?? [],
            'breakdown' => $this->breakdown ?? [],
            'generated_at' => $this->generated_at,
        ];
    }
}
