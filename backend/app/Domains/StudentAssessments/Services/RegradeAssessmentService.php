<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Enums\ProficiencyLevel;
use App\Domains\StudentAssessments\Models\StudentAssessmentEvidence;
use App\Domains\StudentAssessments\Models\StudentAssessmentRecommendation;
use App\Domains\StudentAssessments\Models\StudentAssessmentResponse;
use App\Domains\StudentAssessments\Models\StudentAssessmentResult;
use App\Domains\StudentAssessments\Models\StudentCompetencyResult;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

final class RegradeAssessmentService
{
    public function __construct(
        private readonly CompetencyEvaluationService $competencyService,
        private readonly AssessmentRecommendationService $recommendationService,
        private readonly ScenarioEvaluationService $scenarioService,
        private readonly DimensionScoringService $dimensionService,
    ) {}

    /**
     * Apply human grades and recompute every derived artifact.
     *
     * @param array<string, array{points_earned: int, feedback?: ?string}> $grades keyed by question id
     */
    public function regrade(AssessmentAttempt $attempt, User $instructor, array $grades): array
    {
        return DB::transaction(function () use ($attempt, $instructor, $grades) {
            $attempt->loadMissing(['assessment.course', 'result']);

            if ($attempt->assessment->course->instructor_id !== $instructor->id) {
                throw new LogicException('You can only regrade attempts for your own courses.');
            }

            if ($attempt->result === null) {
                throw new LogicException('Only submitted attempts with a result can be regraded.');
            }

            if ($attempt->status === AssessmentAttemptStatus::IN_PROGRESS) {
                throw new LogicException('In-progress attempts cannot be regraded. Submit first.');
            }

            $questions = $attempt->assessment->questions()->with('options')->get()->keyBy(fn ($q) => (string) $q->id);

            foreach ($grades as $questionId => $grade) {
                $questionId = (string) $questionId;

                if (! $questions->has($questionId)) {
                    throw new LogicException('Graded question does not belong to this assessment.');
                }

                $points = (int) $questions->get($questionId)->pivot->points;
                $earned = max(0, min($points, (int) ($grade['points_earned'] ?? 0)));

                \App\Domains\Assessments\Models\AssessmentAttemptAnswer::updateOrCreate(
                    ['assessment_attempt_id' => $attempt->id, 'question_id' => $questionId],
                    [
                        'is_correct' => $earned >= $points,
                        'points_earned' => $earned,
                        'evaluation_status' => 'human_graded',
                        'feedback' => $grade['feedback'] ?? null,
                        'answered_at' => now(),
                    ],
                );

                StudentAssessmentResponse::where('attempt_id', $attempt->id)
                    ->where('question_id', $questionId)
                    ->update([
                        'is_correct' => $earned >= $points,
                        'points_awarded' => $earned,
                        'evaluation_status' => 'human_graded',
                        'feedback' => $grade['feedback'] ?? null,
                        'updated_at' => now(),
                    ]);
            }

            // Recompute headline numbers from all stored answers.
            $answers = \App\Domains\Assessments\Models\AssessmentAttemptAnswer::where('assessment_attempt_id', $attempt->id)->get();
            $totalPoints = $questions->sum(fn ($q) => (int) $q->pivot->points);
            $pointsEarned = (int) $answers->sum('points_earned');
            $percentage = $totalPoints > 0 ? round(($pointsEarned / $totalPoints) * 100, 2) : 0.0;
            $passed = $percentage >= (float) $attempt->assessment->minimum_score;

            $attempt->update(['score' => $percentage, 'passed' => $passed]);
            $attempt->result->update(['score' => $percentage, 'passed' => $passed]);

            $studentResult = StudentAssessmentResult::where('attempt_id', $attempt->id)->firstOrFail();

            // Wipe derived rows, then rebuild through the shared services
            // so a regrade can never duplicate evidence or recommendations.
            StudentAssessmentEvidence::where('attempt_id', $attempt->id)->delete();
            StudentCompetencyResult::where('attempt_id', $attempt->id)->delete();
            StudentAssessmentRecommendation::where('attempt_id', $attempt->id)->delete();

            $rows = $answers->map(function ($answer) use ($questions) {
                $question = $questions->get((string) $answer->question_id);
                $points = (int) $question->pivot->points;
                $response = StudentAssessmentResponse::where('attempt_id', $answer->assessment_attempt_id)
                    ->where('question_id', $answer->question_id)
                    ->first();

                return [
                    'question_id' => $answer->question_id,
                    'type' => $question->type->value,
                    'points' => $points,
                    'points_earned' => (int) $answer->points_earned,
                    'fraction' => $points > 0 ? round($answer->points_earned / $points, 4) : 0.0,
                    'is_correct' => (bool) $answer->is_correct,
                    'confidence_level' => $response?->confidence_level?->value ?? $response?->confidence_level,
                    'confidence_tag' => 'unrated',
                    'evaluation_status' => $answer->evaluation_status ?? 'evaluated',
                ];
            })->values()->all();

            $dimensions = $this->dimensionService->dimensionScores($rows);

            $studentResult->update([
                'score' => $percentage,
                'percentage' => $percentage,
                'passed' => $passed,
                'proficiency_level' => ProficiencyLevel::fromPercentage(
                    $percentage,
                    $attempt->assessment->getProficiencyThresholds(),
                ),
                'knowledge_score' => $dimensions['knowledge'],
                'application_score' => $dimensions['application'],
                'problem_solving_score' => $dimensions['problem_solving'],
                'decision_score' => $this->scenarioService->decisionScore($attempt),
            ]);

            $scoring = ['results' => $rows, 'evidence' => [], 'score' => $percentage, 'passed' => $passed];
            $competencyResults = $this->competencyService->evaluate($attempt, $studentResult->fresh(), $scoring);
            $scenarioEvidence = $this->scenarioService->buildEvidence($attempt, $studentResult->fresh());
            $recommendations = $this->recommendationService->generate($attempt, $studentResult->fresh(), $competencyResults);

            return [
                'assessment_result' => $attempt->result->fresh(),
                'student_result' => $studentResult->fresh(),
                'score' => $percentage,
                'passed' => $passed,
                'competency_results' => $competencyResults,
                'recommendations' => $recommendations,
                'scenario_evidence' => $scenarioEvidence,
            ];
        });
    }

    /**
     * Answers awaiting human review across an instructor's course.
     */
    public function pendingReviews(string $courseId, int $limit = 50)
    {
        $assessmentIds = \App\Domains\Assessments\Models\Assessment::where('course_id', $courseId)->pluck('id');

        return \App\Domains\Assessments\Models\AssessmentAttemptAnswer::whereHas('attempt', fn ($q) => $q->whereIn('assessment_id', $assessmentIds))
            ->where('evaluation_status', 'pending_review')
            ->with(['attempt:id,assessment_id,user_id,attempt_number', 'question:id,question,type'])
            ->latest('updated_at')
            ->limit(max(1, $limit))
            ->get();
    }
}
