<?php

namespace App\Domains\Simulator\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SimulatorSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vehicle_key' => $this->vehicle_key,
            'tool' => $this->tool,
            'scenario_key' => $this->scenario_key,
            'status' => $this->status,
            'started_at' => $this->started_at?->toISOString(),
            'ended_at' => $this->ended_at?->toISOString(),
            'duration_seconds' => $this->duration_seconds,
            'score' => $this->score,
        ];
    }
}