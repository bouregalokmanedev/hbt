<?php

namespace App\Http\Resources\Api\V1\Assessments;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class AssessmentResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'assessment_id' => $this->assessment_id,
            'assessment_attempt_id' => $this->assessment_attempt_id,
            'user_id' => $this->user_id,

            'score' => $this->score,
            'passed' => $this->passed,

            'attempt_number' => $this->attempt_number,

            'completed_at' => $this->completed_at,

            'evidence' => $this->evidence,
            'results' => $this->results,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}