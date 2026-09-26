<?php

namespace App\Domains\DiagnosticScenarios\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class DiagnosticAttemptResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'scenario_id' => $this->diagnostic_scenario_id,
            'scenario' => $this->whenLoaded('scenario', fn () => [
                'id' => $this->scenario->id,
                'title' => $this->scenario->title,
            ]),
            'attempt_number' => $this->attempt_number,
            'scenario_version' => $this->scenario_version ?? 1,
            'status' => $this->status->value,
            'score' => $this->score,
            'passed' => $this->passed,
            'student' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->full_name,
                'email' => $this->user->email,
            ] : null),
            'hints_used' => $this->whenCounted('hintUsages'),
            'hint_penalty' => $this->when(
                $this->relationLoaded('hintUsages'),
                fn () => (int) $this->hintUsages->sum('penalty_applied')
            ),
            'started_at' => $this->started_at,
            'submitted_at' => $this->submitted_at,
            'completed_at' => $this->completed_at,
            'result' => $this->whenLoaded('result', fn () => $this->result
                ? new DiagnosticResultResource($this->result)
                : null),
        ];
    }
}
