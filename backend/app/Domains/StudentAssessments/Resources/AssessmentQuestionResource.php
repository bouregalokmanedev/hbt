<?php

namespace App\Domains\StudentAssessments\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AssessmentQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'question' => $this->question,
            'type' => $this->type?->value ?? $this->type ?? null,
            'position' => $this->pivot->position ?? $this->position ?? null,
            'points' => $this->pivot->points ?? $this->points ?? null,
            // During attempt — no correct flag
            'options' => $this->whenLoaded('options', fn () => $this->options->map(fn ($o) => [
                'id' => $o->id,
                'option' => $o->option,
            ])->values()->all()),
        ];
    }
}
