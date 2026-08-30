<?php

namespace App\Domains\AI\DTOs;

use App\Domains\AI\Enums\MentorLearningLevel;

final readonly class MentorStudentProfile
{
    public function __construct(
        // Core identity/context
        public ?string $userId = null,
        public ?string $courseId = null,

        // Learning level
        public MentorLearningLevel $level = MentorLearningLevel::BEGINNER,

        // Course metrics
        public int $coursesEnrolled = 0,
        public int $coursesCompleted = 0,

        // Performance metrics
        public float $averageQuizScore = 0.0,
        public float $averageAssessmentScore = 0.0,
        public float $averageDiagnosticScore = 0.0,

        // Lesson metrics
        public int $lessonsCompleted = 0,
        public int $lessonsInProgress = 0,

        // Detailed profile metrics
        public int $overallProgress = 0,
        public int $courseProgress = 0,
        public int $lessonProgress = 0,
        public int $quizPerformance = 0,
        public int $assessmentPerformance = 0,
        public int $diagnosticPerformance = 0,
        public int $coursesStarted = 0,

        // AI learning signals
        public array $weakAreas = [],
        public array $strongAreas = [],
        public array $recentFailures = [],
        public array $recentSuccesses = [],
    ) {
    }

    /**
     * Backward-compatible alias used by the mentor service.
     */
    public function getLearningLevel(): MentorLearningLevel
    {
        return $this->level;
    }
    public function __get(string $name): mixed
{
    if ($name === 'learningLevel') {
        return $this->level;
    }

    throw new \LogicException(
        sprintf('Undefined property: %s::$%s', self::class, $name)
    );
}

  public function toArray(): array
{
    return [
        'user_id' => $this->userId,
        'course_id' => $this->courseId,
        'learning_level' => $this->level->value,
        'overall_progress' => $this->overallProgress,
        'course_progress' => $this->courseProgress,
        'lesson_progress' => $this->lessonProgress,
        'quiz_performance' => $this->quizPerformance,
        'assessment_performance' => $this->assessmentPerformance,
        'diagnostic_performance' => $this->diagnosticPerformance,
        'courses_started' => $this->coursesStarted,
        'courses_completed' => $this->coursesCompleted,

        'courses_enrolled' => $this->coursesEnrolled,
        'average_quiz_score' => $this->averageQuizScore,
        'average_assessment_score' => $this->averageAssessmentScore,
        'average_diagnostic_score' => $this->averageDiagnosticScore,
        'lessons_completed' => $this->lessonsCompleted,
        'lessons_in_progress' => $this->lessonsInProgress,

        'weak_areas' => $this->weakAreas,
        'strong_areas' => $this->strongAreas,
        'recent_failures' => $this->recentFailures,
        'recent_successes' => $this->recentSuccesses,
    ];
}
}