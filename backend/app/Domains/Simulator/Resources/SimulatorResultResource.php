<?php

namespace App\Domains\Simulator\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SimulatorResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'session_id' => $this->session_id,
            'tool' => $this->tool,
            'scenario_key' => $this->scenario_key,
            'score' => $this->score,
            'outcome' => $this->outcome,
            'verdict' => $this->verdict,
            'attempts' => $this->attempts,
            'hints_used' => $this->hints_used,
            'duration_seconds' => $this->duration_seconds,
            'steps' => $this->steps,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}