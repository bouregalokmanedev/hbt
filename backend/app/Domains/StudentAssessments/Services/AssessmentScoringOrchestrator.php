<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Services\AssessmentScoringService;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class AssessmentScoringOrchestrator
{
    public function __construct(private readonly AssessmentScoringService $scoringService) {}

    /**
     * Convert StudentAssessmentResponses into legacy scoring input.
     */
    public function buildSubmittedAnswers(AssessmentAttempt $attempt): array
    {
        $responses = \App\Domains\StudentAssessments\Models\StudentAssessmentResponse::where('attempt_id', $attempt->id)->get();

        if ($responses->isEmpty()) {
            return [];
        }

        return $responses->map(function ($r) {
            $answer = $r->answer ?? [];

            if (! is_array($answer)) {
                $answer = ['value' => $answer];
            }

            // Pass the full autosaved payload through so the scorer can
            // dispatch on question type (options / value / ordering / matches).
            return array_merge($answer, [
                'question_id' => $r->question_id,
                'confidence_level' => $r->confidence_level?->value ?? $r->confidence_level,
            ]);
        })->values()->all();
    }

    public function calculate(AssessmentAttempt $attempt, User $user, ?array $submittedAnswers = null): array
    {
        $submittedAnswers ??= $this->buildSubmittedAnswers($attempt);

        // If still empty, load from request payload already normalized
        return $this->scoringService->calculate($attempt, $user, $submittedAnswers);
    }
}
