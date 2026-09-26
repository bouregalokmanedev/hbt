<?php

namespace App\Domains\Assessments\Services;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentAttemptAnswer;
use App\Domains\Assessments\Models\AssessmentAttemptAnswerOption;
use App\Domains\StudentAssessments\Enums\ConfidenceLevel;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

final class AssessmentScoringService
{
    public function __construct(
        private readonly QuestionGradingService $grading,
    ) {}

    /**
     * Calculate and persist the final assessment score.
     *
     * The final score is based ONLY on questions
     * assigned directly to the assessment.
     *
     * Course lessons, prerequisite quizzes and
     * diagnostic scenarios are eligibility requirements,
     * not scoring inputs.
     */
    public function calculate(
        AssessmentAttempt $attempt,
        User $user,
        array $submittedAnswers,
    ): array {
        return DB::transaction(function () use (
            $attempt,
            $user,
            $submittedAnswers,
        ) {
            $attempt->loadMissing('assessment');

            if ($attempt->user_id !== $user->id) {
                throw new LogicException(
                    'User cannot score another user\'s assessment attempt.'
                );
            }

            $assessment = $attempt->assessment;

            $assessmentQuestions = $assessment
                ->questions()
                ->with('options')
                ->get()
                ->keyBy('id');

            $score = 0;
            $totalPoints = 0;

            $results = [];
            $evidence = [];
            $confidenceLevels = [];

            foreach ($assessmentQuestions as $question) {
                $totalPoints += (int) $question->pivot->points;
            }

            foreach ($submittedAnswers as $submittedAnswer) {
                $questionId = $submittedAnswer['question_id'];

                if (! $assessmentQuestions->has($questionId)) {
                    throw new LogicException(
                        'Submitted question does not belong to this assessment.'
                    );
                }

                $question = $assessmentQuestions->get($questionId);
                $questionPoints = (int) $question->pivot->points;

                $payload = $submittedAnswer;
                unset($payload['question_id']);

                $grade = $this->grading->grade($question, $payload, $questionPoints);

                $selectedOptionIds = collect($grade['selected_option_ids'] ?? [])
                    ->map(fn ($id) => (string) $id)
                    ->unique()
                    ->values();

                $pointsEarned = (int) $grade['points_earned'];
                $score += $pointsEarned;

                $confidenceRaw = $submittedAnswer['confidence_level']
                    ?? $this->autosavedConfidence($attempt, $question->id);

                if ($confidenceRaw !== null) {
                    $confidenceLevels[] = $confidenceRaw;
                }

                $confidenceTag = $this->grading->classifyConfidence(
                    $grade['is_correct'],
                    $confidenceRaw,
                );

                $answer = AssessmentAttemptAnswer::updateOrCreate(
                    [
                        'assessment_attempt_id' => $attempt->id,
                        'question_id' => $question->id,
                    ],
                    [
                        'is_correct' => $grade['is_correct'],
                        'points_earned' => $pointsEarned,
                        'answer' => $payload,
                        'evaluation_status' => $grade['evaluation_status'] ?? 'evaluated',
                        'feedback' => $grade['feedback'] ?? null,
                    ],
                );

                $answer->selectedOptions()->delete();

                foreach ($selectedOptionIds as $optionId) {
                    AssessmentAttemptAnswerOption::create([
                        'answer_id' => $answer->id,
                        'option_id' => $optionId,
                    ]);
                }

                $results[] = [
                    'question_id' => $question->id,
                    'type' => $question->type?->value ?? (string) $question->type,
                    'points' => $questionPoints,
                    'points_earned' => $pointsEarned,
                    'is_correct' => $grade['is_correct'],
                    'fraction' => $grade['fraction'],
                    'normalized_answer' => $grade['normalized_answer'] ?? [],
                    'selected_option_ids' => $selectedOptionIds->all(),
                    'evidence' => $grade['evidence'] ?? [],
                    'feedback' => $grade['feedback'] ?? null,
                    'evaluation_status' => $grade['evaluation_status'] ?? 'evaluated',
                    'confidence_level' => $confidenceRaw,
                    'confidence_tag' => $confidenceTag,
                ];

                $evidence[] = [
                    'question_id' => $question->id,
                    'selected_option_ids' => $selectedOptionIds->all(),
                    'correct_option_ids' => $grade['evidence']['correct_option_ids'] ?? [],
                ];
            }

            $percentage = $totalPoints > 0
                ? round(($score / $totalPoints) * 100, 2)
                : 0.0;

            $passed = $percentage >=
                (float) $assessment->minimum_score;

            $confidenceScore = null;
            if ($confidenceLevels !== []) {
                $confidenceScore = collect($confidenceLevels)
                    ->map(fn ($level) => $this->grading->confidenceToScore($level))
                    ->avg();
            }

            return [
                'score' => $percentage,
                'passed' => $passed,
                'evidence' => $evidence,
                'results' => $results,
                'total_points' => $totalPoints,
                'points_earned' => $score,
                'confidence_score' => $confidenceScore,
            ];
        });
    }

    private function autosavedConfidence(
        AssessmentAttempt $attempt,
        string $questionId,
    ): mixed {
        $response = \App\Domains\StudentAssessments\Models\StudentAssessmentResponse::query()
            ->where('attempt_id', $attempt->id)
            ->where('question_id', $questionId)
            ->first();

        $level = $response?->confidence_level;

        if ($level instanceof ConfidenceLevel) {
            return $level->value;
        }

        return $level;
    }
}
