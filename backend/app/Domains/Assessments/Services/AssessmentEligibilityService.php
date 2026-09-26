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
            'section.lessons',
            'lesson',
            'quizzes',
            'diagnosticScenarios',
        ]);

        $scope = $assessment->scope();
        $isPublished = $assessment->status->value === 'published';

        $lessons = match ($scope) {
            'lesson' => collect($assessment->lesson ? [$assessment->lesson] : []),
            'section' => $assessment->section
                ? $assessment->section->lessons
                : collect(),
            default => $assessment->course
                ->sections
                ->flatMap(fn ($section) => $section->lessons),
        };

        if ($scope === 'lesson') {
            $lesson = $assessment->lesson;
            $requiredLessons = 1;
            $lessonAccessible = $lesson !== null
                && $lesson->status?->value === 'published'
                && ($assessment->section_id === null
                    || $lesson->section_id === $assessment->section_id);
            $completedLessons = $lessonAccessible
                ? $this->completedLessons($lessons, $user)
                : 0;
            // Formative/lesson-scoped assessments open mid-course without
            // requiring prior completions as long as the lesson is live.
            $lessonEligible = $lessonAccessible;
        } else {
            $requiredLessons = $lessons->count();
            $completedLessons = $this->completedLessons($lessons, $user);
            $lessonEligible = $completedLessons >= $requiredLessons;
        }

        $sectionEvidence = $this->evaluateSectionAssessments($assessment, $user, $scope);

        $quizEvidence = $this->evaluateQuizzes(
            $assessment,
            $user
        );

        $scenarioEvidence = $this->evaluateScenarios(
            $assessment,
            $user
        );

        $eligible =
            $isPublished
            && $lessonEligible
            && $sectionEvidence['eligible']
            && $quizEvidence['eligible']
            && $scenarioEvidence['eligible'];

        return [
            'eligible' => $eligible,

            'assessment' => [
                'id' => $assessment->id,
                'status' => $assessment->status->value,
                'scope' => $scope,
            ],

            'lessons' => [
                'required' => $requiredLessons,
                'completed' => $completedLessons,
                'eligible' => $lessonEligible,
                'scope' => $scope,
            ],

            'section_assessments' => $sectionEvidence,

            'quizzes' => $quizEvidence,

            'scenarios' => $scenarioEvidence,
        ];
    }

    /**
     * Course-scoped assessments may require passed section assessments
     * before the final attempt unlocks.
     */
    private function evaluateSectionAssessments(
        Assessment $assessment,
        User $user,
        string $scope,
    ): array {
        if ($scope !== 'course') {
            return [
                'required' => 0,
                'completed' => 0,
                'eligible' => true,
                'items' => [],
            ];
        }

        $required = Assessment::query()
            ->where('course_id', $assessment->course_id)
            ->whereNotNull('section_id')
            ->whereNull('lesson_id')
            ->where('is_required', true)
            ->where('status', 'published')
            ->get();

        if ($required->isEmpty()) {
            return [
                'required' => 0,
                'completed' => 0,
                'eligible' => true,
                'items' => [],
            ];
        }

        $passedIds = \App\Domains\Assessments\Models\AssessmentResult::query()
            ->where('user_id', $user->id)
            ->whereIn('assessment_id', $required->pluck('id'))
            ->where('passed', true)
            ->pluck('assessment_id')
            ->all();

        $completed = count($passedIds);

        return [
            'required' => $required->count(),
            'completed' => $completed,
            'eligible' => $completed >= $required->count(),
            'items' => $required->map(fn ($a) => [
                'assessment_id' => $a->id,
                'section_id' => $a->section_id,
                'passed' => in_array($a->id, $passedIds, true),
            ])->values()->all(),
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