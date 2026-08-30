<?php

namespace App\Domains\Assessments\Services;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentAttemptAnswer;
use App\Domains\Assessments\Models\AssessmentAttemptAnswerOption;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

final class AssessmentScoringService
{
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

            /*
             * Load only questions that belong to this assessment.
             */
            $assessmentQuestions = $assessment
                ->questions()
                ->with('options')
                ->get()
                ->keyBy('id');

            $score = 0;
            $totalPoints = 0;

            $results = [];
            $evidence = [];

            /*
             * Total possible points come from the assessment
             * question pivot.
             */
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

                /** @var QuizQuestion $question */
                $question = $assessmentQuestions->get($questionId);

                $selectedOptionIds = collect(
                    $submittedAnswer['option_ids'] ?? []
                )
                    ->map(fn ($id) => (string) $id)
                    ->unique()
                    ->values();

                /*
                 * Make sure every selected option actually belongs
                 * to the submitted question.
                 */
                $questionOptionIds = $question->options
                    ->pluck('id')
                    ->map(fn ($id) => (string) $id)
                    ->values();

                if (
                    $selectedOptionIds
                        ->diff($questionOptionIds)
                        ->isNotEmpty()
                ) {
                    throw new LogicException(
                        'Submitted option does not belong to the question.'
                    );
                }

                /*
                 * Correct options for this question.
                 */
                $correctOptionIds = $question->options
                    ->where('is_correct', true)
                    ->pluck('id')
                    ->map(fn ($id) => (string) $id)
                    ->sort()
                    ->values();

                $selectedSorted = $selectedOptionIds
                    ->sort()
                    ->values();

                /*
                 * Exact set comparison.
                 *
                 * This supports single-choice and multiple-choice
                 * questions.
                 */
                $isCorrect = $selectedSorted->all() ===
                    $correctOptionIds->all();

                $questionPoints = (int) $question->pivot->points;

                $pointsEarned = $isCorrect
                    ? $questionPoints
                    : 0;

                $score += $pointsEarned;

                /*
                 * Persist the answer.
                 */
                $answer = AssessmentAttemptAnswer::updateOrCreate(
                    [
                        'assessment_attempt_id' => $attempt->id,
                        'question_id' => $question->id,
                    ],
                    [
                        'is_correct' => $isCorrect,
                        'points_earned' => $pointsEarned,
                    ],
                );

                /*
                 * Persist selected options.
                 *
                 * Delete first so recalculation remains safe.
                 */
                $answer->selectedOptions()->delete();

                foreach ($selectedOptionIds as $optionId) {
                    AssessmentAttemptAnswerOption::create([
                        'answer_id' => $answer->id,
                        'option_id' => $optionId,
                    ]);
                }

                $results[] = [
                    'question_id' => $question->id,
                    'points' => $questionPoints,
                    'points_earned' => $pointsEarned,
                    'is_correct' => $isCorrect,
                ];

                $evidence[] = [
                    'question_id' => $question->id,
                    'selected_option_ids' => $selectedOptionIds->all(),
                    'correct_option_ids' => $correctOptionIds->all(),
                ];
            }

            $percentage = $totalPoints > 0
                ? round(($score / $totalPoints) * 100, 2)
                : 0.0;

            $passed = $percentage >=
                (float) $assessment->minimum_score;

            return [
                'score' => $percentage,
                'passed' => $passed,
                'evidence' => $evidence,
                'results' => $results,
                'total_points' => $totalPoints,
                'points_earned' => $score,
            ];
        });
    }
}