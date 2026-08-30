<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\DTOs\MentorStudentProfile;
use App\Domains\AI\Enums\MentorLearningLevel;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\CourseProgress;
use App\Models\LessonProgress;
use App\Models\User;

final class MentorStudentProfileService
{
    public function build(
        User $user,
        ?string $courseId = null,
    ): MentorStudentProfile {
        $courseProgress = $this->courseProgress(
            $user,
            $courseId,
        );

        $lessonProgress = $this->lessonProgress(
            $user,
            $courseId,
        );

        $quizPerformance = $this->quizPerformance(
            $user,
            $courseId,
        );

        $assessmentPerformance = $this->assessmentPerformance(
            $user,
            $courseId,
        );

        $diagnosticPerformance = $this->diagnosticPerformance(
            $user,
            $courseId,
        );

        $overallProgress = $this->overallProgress(
            $courseProgress,
            $lessonProgress,
            $quizPerformance,
            $assessmentPerformance,
            $diagnosticPerformance,
        );

        $learningLevel = $this->learningLevel(
            $quizPerformance,
            $assessmentPerformance,
            $diagnosticPerformance,
        );

        $coursesStarted = $this->coursesStarted(
            $user,
            $courseId,
        );

        $coursesCompleted = $this->coursesCompleted(
            $user,
            $courseId,
        );

        $lessonsCompleted = $this->lessonsCompleted(
            $user,
            $courseId,
        );

        $lessonsInProgress = $this->lessonsInProgress(
            $user,
            $courseId,
        );

        return new MentorStudentProfile(
            userId: (string) $user->id,
            courseId: $courseId,

            level: $learningLevel,

            coursesEnrolled: $coursesStarted,
            coursesCompleted: $coursesCompleted,

            averageQuizScore: (float) $quizPerformance,
            averageAssessmentScore: (float) $assessmentPerformance,
            averageDiagnosticScore: (float) $diagnosticPerformance,

            lessonsCompleted: $lessonsCompleted,
            lessonsInProgress: $lessonsInProgress,

            overallProgress: $overallProgress,
            courseProgress: $courseProgress,
            lessonProgress: $lessonProgress,
            quizPerformance: $quizPerformance,
            assessmentPerformance: $assessmentPerformance,
            diagnosticPerformance: $diagnosticPerformance,
            coursesStarted: $coursesStarted,

            weakAreas: [],
            strongAreas: [],
            recentFailures: [],
            recentSuccesses: [],
        );
    }

    private function courseProgress(
        User $user,
        ?string $courseId,
    ): int {
        $query = CourseProgress::query()
            ->where('user_id', $user->id);

        if ($courseId !== null) {
            $query->where('course_id', $courseId);
        }

        return $this->average(
            $query->pluck('progress_percentage')->all(),
        );
    }

    private function lessonProgress(
        User $user,
        ?string $courseId,
    ): int {
        $query = LessonProgress::query()
            ->where('user_id', $user->id);

        if ($courseId !== null) {
            $query->whereHas(
                'lesson',
                fn ($lesson) => $lesson->where(
                    'course_id',
                    $courseId,
                ),
            );
        }

        return $this->average(
            $query->pluck('progress_percentage')->all(),
        );
    }

    private function quizPerformance(
        User $user,
        ?string $courseId,
    ): int {
        $query = QuizAttempt::query()
            ->where('user_id', $user->id)
            ->where('status', 'submitted');

        if ($courseId !== null) {
            $query->whereHas(
                'quiz.section',
                fn ($section) => $section->where(
                    'course_id',
                    $courseId,
                ),
            );
        }

        return $this->average(
            $query->pluck('percentage')->all(),
        );
    }

    private function assessmentPerformance(
        User $user,
        ?string $courseId,
    ): int {
        $query = AssessmentAttempt::query()
            ->where('user_id', $user->id)
            ->whereIn('status', [
                'submitted',
                'passed',
                'failed',
            ]);

        if ($courseId !== null) {
            $query->whereHas(
                'assessment',
                fn ($assessment) => $assessment->where(
                    'course_id',
                    $courseId,
                ),
            );
        }

        return $this->average(
            $query->pluck('score')->all(),
        );
    }

    private function diagnosticPerformance(
        User $user,
        ?string $courseId,
    ): int {
        $query = DiagnosticScenarioAttempt::query()
            ->where('user_id', $user->id)
            ->whereIn('status', [
                'submitted',
                'passed',
                'failed',
            ]);

        if ($courseId !== null) {
            $query->whereHas(
                'scenario.assessments',
                fn ($assessment) => $assessment->where(
                    'course_id',
                    $courseId,
                ),
            );
        }

        return $this->average(
            $query->pluck('score')->all(),
        );
    }

    private function coursesStarted(
        User $user,
        ?string $courseId,
    ): int {
        $query = CourseProgress::query()
            ->where('user_id', $user->id);

        if ($courseId !== null) {
            $query->where('course_id', $courseId);
        }

        return $query->count();
    }

    private function coursesCompleted(
        User $user,
        ?string $courseId,
    ): int {
        $query = CourseProgress::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at');

        if ($courseId !== null) {
            $query->where('course_id', $courseId);
        }

        return $query->count();
    }

    private function lessonsCompleted(
        User $user,
        ?string $courseId,
    ): int {
        $query = LessonProgress::query()
            ->where('user_id', $user->id)
            ->whereNotNull('completed_at');

        if ($courseId !== null) {
            $query->whereHas(
                'lesson',
                fn ($lesson) => $lesson->where(
                    'course_id',
                    $courseId,
                ),
            );
        }

        return $query->count();
    }

    private function lessonsInProgress(
        User $user,
        ?string $courseId,
    ): int {
        $query = LessonProgress::query()
            ->where('user_id', $user->id)
            ->whereNull('completed_at')
            ->where('progress_percentage', '>', 0);

        if ($courseId !== null) {
            $query->whereHas(
                'lesson',
                fn ($lesson) => $lesson->where(
                    'course_id',
                    $courseId,
                ),
            );
        }

        return $query->count();
    }

    private function overallProgress(
        int $courseProgress,
        int $lessonProgress,
        int $quizPerformance,
        int $assessmentPerformance,
        int $diagnosticPerformance,
    ): int {
        $values = array_filter(
            [
                $courseProgress,
                $lessonProgress,
                $quizPerformance,
                $assessmentPerformance,
                $diagnosticPerformance,
            ],
            fn (int $value) => $value > 0,
        );

        if ($values === []) {
            return 0;
        }

        return $this->roundAverage($values);
    }

    private function learningLevel(
        int $quizPerformance,
        int $assessmentPerformance,
        int $diagnosticPerformance,
    ): MentorLearningLevel {
        $signals = array_filter(
            [
                $quizPerformance,
                $assessmentPerformance,
                $diagnosticPerformance,
            ],
            fn (int $value) => $value > 0,
        );

        if ($signals === []) {
            return MentorLearningLevel::BEGINNER;
        }

        $score = $this->roundAverage($signals);

        return match (true) {
            $score >= 90 => MentorLearningLevel::ADVANCED,
            $score >= 80 => MentorLearningLevel::INTERMEDIATE,
            $score >= 60 => MentorLearningLevel::DEVELOPING,
            default => MentorLearningLevel::BEGINNER,
        };
    }

    private function average(array $values): int
    {
        if ($values === []) {
            return 0;
        }

        return $this->roundAverage(
            array_map(
                fn ($value) => (float) $value,
                $values,
            ),
        );
    }

    private function roundAverage(array $values): int
    {
        if ($values === []) {
            return 0;
        }

        return (int) round(
            array_sum($values) / count($values),
        );
    }
}