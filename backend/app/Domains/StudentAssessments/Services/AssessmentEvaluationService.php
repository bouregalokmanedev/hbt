<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Actions\SubmitAssessmentAttemptAction;
use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Enums\ProficiencyLevel;
use App\Domains\StudentAssessments\Exceptions\AttemptAlreadySubmittedException;
use App\Domains\StudentAssessments\Events\StudentAssessmentCompleted;
use App\Domains\StudentAssessments\Events\StudentAssessmentEvaluated;
use App\Domains\StudentAssessments\Models\StudentAssessmentResult;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class AssessmentEvaluationService
{
    public function __construct(
        private readonly AssessmentScoringOrchestrator $scoringOrchestrator,
        private readonly SubmitAssessmentAttemptAction $submitAction,
        private readonly CompetencyEvaluationService $competencyService,
        private readonly AssessmentRecommendationService $recommendationService,
        private readonly ScenarioEvaluationService $scenarioService,
        private readonly DimensionScoringService $dimensionService,
        private readonly AdaptiveAttemptService $adaptiveService,
    ) {}

    /**
     * Evaluate and persist result — orchestrates scoring + competency + recommendations.
     */
    public function evaluate(AssessmentAttempt $attempt, User $user, ?array $submittedAnswers = null): array
    {
        // Single server-side expiry enforcement for every submit path.
        // Runs outside the transaction: abort() would roll the EXPIRED
        // marking back, and the cooldown logic depends on it persisting.
        $attempt = $attempt->fresh() ?? $attempt;

        if ($attempt->expires_at?->isPast()) {
            $attempt->update(['status' => AssessmentAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
            abort(422, 'Time expired. You can retake this assessment twelve hours after the timeout.');
        }

        // Submission idempotency: retries, double-clicks and blocked
        // attempts all land here instead of a 500 from the action.
        if ($attempt->status !== AssessmentAttemptStatus::IN_PROGRESS) {
            throw new AttemptAlreadySubmittedException();
        }

        return DB::transaction(function () use ($attempt, $user, $submittedAnswers) {
            $attempt->loadMissing('assessment');

            // Adaptive assessments score by final ability estimate (θ);
            // everything else flows through the standard scorer.
            $scoring = $attempt->assessment->isAdaptive()
                ? $this->adaptiveService->finalize($attempt, $user, $submittedAnswers)
                : $this->scoringOrchestrator->calculate($attempt, $user, $submittedAnswers);

            $result = $this->submitAction->execute(
                attempt: $attempt,
                user: $user,
                scoring: $scoring,
            );

            StudentAssessmentEvaluated::dispatch($result);

            // Build student_assessment_results (comprehensive)
            $proficiency = ProficiencyLevel::fromPercentage((float) $scoring['score']);
            $dimensions = $this->dimensionService->dimensionScores($scoring['results'] ?? []);

            $studentResult = StudentAssessmentResult::create([
                'attempt_id' => $attempt->id,
                'student_id' => $user->id,
                'assessment_id' => $attempt->assessment_id,
                'score' => $scoring['score'],
                'percentage' => $scoring['score'],
                'passed' => $scoring['passed'],
                'proficiency_level' => $proficiency,
                'knowledge_score' => $dimensions['knowledge'],
                'application_score' => $dimensions['application'],
                'problem_solving_score' => $dimensions['problem_solving'],
                'confidence_score' => $scoring['confidence_score'] ?? null,
                'time_efficiency_score' => $this->dimensionService->timeEfficiency($attempt->fresh()),
                'started_at' => $attempt->started_at,
                'completed_at' => now(),
                'result_status' => 'completed',
                'generated_at' => now(),
            ]);

            // Backfill autosaved responses with evaluation outcomes so the
            // attempt view, navigation and review share one source of truth.
            // AI-pending answers keep their pending_review status for the
            // human review queue instead of being marked evaluated.
            foreach ($scoring['results'] ?? [] as $row) {
                \App\Domains\StudentAssessments\Models\StudentAssessmentResponse::where('attempt_id', $attempt->id)
                    ->where('question_id', $row['question_id'])
                    ->update([
                        'is_correct' => $row['is_correct'],
                        'points_awarded' => $row['points_earned'],
                        'evaluation_status' => $row['evaluation_status'] ?? 'evaluated',
                        'feedback' => $this->feedbackFor($row),
                        'updated_at' => now(),
                    ]);
            }

            // Scenario paths recorded during the attempt become evidence and
            // feed the decision-making dimension. They never affect the
            // question-based pass/fail score.
            $scenarioEvidence = $this->scenarioService->buildEvidence($attempt, $studentResult);
            $decisionScore = $this->scenarioService->decisionScore($attempt);

            if ($decisionScore !== null) {
                $studentResult->update(['decision_score' => $decisionScore]);
            }

            // Competency evaluation (creates question evidence)
            $competencyResults = $this->competencyService->evaluate($attempt, $studentResult, $scoring);

            // Recommendations for weak competencies
            $recommendations = $this->recommendationService->generate($attempt, $studentResult, $competencyResults);

            StudentAssessmentCompleted::dispatch($result);

            return [
                'assessment_result' => $result,
                'student_result' => $studentResult->fresh(),
                'scoring' => $scoring,
                'competency_results' => $competencyResults,
                'recommendations' => $recommendations,
                'scenario_evidence' => $scenarioEvidence,
                'decision_score' => $decisionScore,
            ];
        });
    }

    private function feedbackFor(array $row): string
    {
        if ($row['is_correct'] ?? false) {
            return 'Correct.';
        }

        if (($row['fraction'] ?? 0) > 0) {
            return 'Partially correct.';
        }

        return match ($row['confidence_tag'] ?? null) {
            'misconception' => 'Incorrect — review this topic; you were confident but wrong.',
            'knowledge_gap' => 'Incorrect — review this topic.',
            default => 'Incorrect.',
        };
    }
}
