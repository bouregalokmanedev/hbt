<?php

namespace App\Domains\Assessments\Services;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Models\Lesson;
use App\Models\User;
use App\Models\LessonProgress;

final class AssessmentEligibilityService
{
    /**
     * Evaluate whether a user is eligible to start an assessment.
     *
     * The result contains both the final eligibility state and
     * the evidence used to reach that decision.
     */
    public function evaluate(
        Assessment $assessment,
        User $user,
    ): array {
        $assessment->loadMissing([
            'course.sections.lessons',
            'quizzes',
            'diagnosticScenarios',
        ]);

        $lessons = $assessment->course
            ->sections
            ->flatMap(fn ($section) => $section->lessons);

        $requiredLessons = $lessons->count();

        $completedLessons = $this->completedLessons(
            $lessons,
            $user
        );

        $lessonEligible = $completedLessons >= $requiredLessons;

        $quizEvidence = $this->evaluateQuizzes(
            $assessment,
            $user
        );

        $scenarioEvidence = $this->evaluateScenarios(
            $assessment,
            $user
        );

        $isPublished = $assessment->status->value === 'published';

        $eligible =
            $isPublished
            && $lessonEligible
            && $quizEvidence['eligible']
            && $scenarioEvidence['eligible'];

        return [
            'eligible' => $eligible,

            'assessment' => [
                'id' => $assessment->id,
                'status' => $assessment->status->value,
            ],

            'lessons' => [
                'required' => $requiredLessons,
                'completed' => $completedLessons,
                'eligible' => $lessonEligible,
            ],

            'quizzes' => $quizEvidence,

            'scenarios' => $scenarioEvidence,
        ];
    }

    /**
     * Convenience method when only the boolean result is required.
     */
    public function isEligible(
        Assessment $assessment,
        User $user,
    ): bool {
        return $this->evaluate($assessment, $user)['eligible'];
    }

    /**
     * Count completed lessons for the user.
     *
     * Lesson completion is represented by lesson_progress.completed_at.
     */
  private function completedLessons(
    $lessons,
    User $user,
): int {
    if ($lessons->isEmpty()) {
        return 0;
    }

    return LessonProgress::query()
        ->whereIn('lesson_id', $lessons->pluck('id'))
        ->where('user_id', $user->id)
        ->whereNotNull('completed_at')
        ->count();
}

    /**
     * Evaluate all quizzes assigned to the assessment.
     *
     * Every assigned quiz must have a submitted attempt whose
     * percentage reaches the assessment's required quiz score.
     */
    private function evaluateQuizzes(
        Assessment $assessment,
        User $user,
    ): array {
        $quizzes = $assessment->quizzes;

        $requiredScore = (int) $assessment->required_quiz_score;

        if ($quizzes->isEmpty()) {
            return [
                'required' => 0,
                'completed' => 0,
                'required_score' => $requiredScore,
                'eligible' => true,
                'items' => [],
            ];
        }

        $items = $quizzes->map(function ($quiz) use (
            $user,
            $requiredScore
        ) {
            $attempt = $quiz->attempts()
                ->where('user_id', $user->id)
                ->where('status', QuizAttemptStatus::SUBMITTED)
                ->orderByDesc('attempt_number')
                ->first();

            $score = $attempt?->percentage !== null
                ? (int) $attempt->percentage
                : null;

            return [
                'quiz_id' => $quiz->id,
                'score' => $score,
                'required_score' => $requiredScore,
                'eligible' => $score !== null
                    && $score >= $requiredScore,
            ];
        });

        $completed = $items
            ->where('eligible', true)
            ->count();

        return [
            'required' => $quizzes->count(),
            'completed' => $completed,
            'required_score' => $requiredScore,
            'eligible' => $completed === $quizzes->count(),
            'items' => $items->values()->all(),
        ];
    }

    /**
     * Evaluate required diagnostic scenarios.
     *
     * The assessment specifies the minimum number of scenarios
     * that must be successfully completed.
     */
    private function evaluateScenarios(
        Assessment $assessment,
        User $user,
    ): array {
        $required = (int) $assessment->required_scenarios;

        if ($required === 0) {
            return [
                'required' => 0,
                'completed' => 0,
                'eligible' => true,
                'items' => [],
            ];
        }

        $scenarios = $assessment->diagnosticScenarios;

        $items = $scenarios->map(function ($scenario) use ($user) {
            $attempt = $scenario->attempts()
                ->where('user_id', $user->id)
                ->where(
                    'status',
                    DiagnosticScenarioAttemptStatus::SUBMITTED
                )
                ->where('passed', true)
                ->orderByDesc('attempt_number')
                ->first();

            return [
                'scenario_id' => $scenario->id,
                'passed' => $attempt !== null,
                'score' => $attempt?->score,
            ];
        });

        $completed = $items
            ->where('passed', true)
            ->count();

        return [
            'required' => $required,
            'completed' => $completed,
            'eligible' => $completed >= $required,
            'items' => $items->values()->all(),
        ];
    }
}