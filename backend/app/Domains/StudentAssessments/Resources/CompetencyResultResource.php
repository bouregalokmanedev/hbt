<?php

namespace App\Domains\StudentAssessments\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class CompetencyResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'attempt_id' => $this->attempt_id,
            'result_id' => $this->result_id,
            'competency_id' => $this->competency_id,
            'competency_name' => $this->competency_name,
            'score' => $this->score,
            'percentage' => $this->percentage,
            'proficiency_level' => $this->proficiency_level?->value ?? $this->proficiency_level,
            'confidence' => $this->confidence,
            'evidence_count' => $this->evidence_count,
            'strength_level' => $this->strength_level,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
