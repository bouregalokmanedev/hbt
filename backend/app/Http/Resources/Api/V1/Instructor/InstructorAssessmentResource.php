<?php

namespace App\Http\Resources\Api\V1\Instructor;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class InstructorAssessmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'course_id' => $this->course_id,
            'section_id' => $this->section_id,
            'lesson_id' => $this->lesson_id,
            'scope' => $this->resource->scope(),
            'section' => $this->whenLoaded('section', fn () => $this->section ? ['id' => $this->section->id, 'title' => $this->section->title] : null),
            'lesson' => $this->whenLoaded('lesson', fn () => $this->lesson ? ['id' => $this->lesson->id, 'title' => $this->lesson->title] : null),
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'minimum_score' => $this->minimum_score,
            'required_quiz_score' => $this->required_quiz_score,
            'required_scenarios' => $this->required_scenarios,
            'max_attempts' => $this->max_attempts,
            'is_required' => $this->is_required,
            'status' => $this->status?->value ?? $this->status,
            'assessment_mode' => $this->assessment_mode?->value ?? $this->assessment_mode,
            'interaction_types' => $this->interaction_types,
            'proficiency_thresholds' => $this->proficiency_thresholds,
            'adaptive_config' => $this->adaptive_config,
            'published_at' => $this->published_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            'questions_count' => $this->whenLoaded('questions', fn () => $this->questions->count()),
            'competencies_count' => $this->whenLoaded('competencies', fn () => $this->competencies->count()),
            'competencies' => $this->whenLoaded('competencies', fn () => $this->competencies->map(fn ($c) => [
                'id' => $c->id,
                'code' => $c->code,
                'name' => $c->name,
                'category' => $c->category,
                'pivot' => [
                    'position' => $c->pivot->position ?? 0,
                    'weight' => $c->pivot->weight ?? 1.0,
                ],
            ])->values()->all()),
            'questions' => $this->whenLoaded('questions', function () {
                $competencyIds = $this->questions->map(fn ($q) => $q->pivot->competency_id ?? null)->filter()->unique()->values();
                $competencyMap = $competencyIds->isEmpty()
                    ? collect()
                    : \App\Domains\Assessments\Models\Competency::whereIn('id', $competencyIds)->get()->keyBy('id');

                return $this->questions->map(function ($q) use ($competencyMap) {
                    $competency = ($q->pivot->competency_id ?? null) ? $competencyMap->get($q->pivot->competency_id) : null;

                    return [
                        'id' => $q->id,
                        'question_id' => $q->id,
                        'question' => $q->question,
                        'type' => $q->type?->value ?? $q->type,
                        'position' => $q->pivot->position ?? 0,
                        'points' => $q->pivot->points ?? 1,
                        'competency_id' => $q->pivot->competency_id ?? null,
                        'competency' => $competency ? [
                            'id' => $competency->id,
                            'code' => $competency->code,
                            'name' => $competency->name,
                        ] : null,
                        'options' => $q->options?->map(fn ($o) => [
                            'id' => $o->id,
                            'option' => $o->option,
                            'is_correct' => $o->is_correct,
                        ])->values()->all(),
                    ];
                })->values()->all();
            }),
        ];
    }
}