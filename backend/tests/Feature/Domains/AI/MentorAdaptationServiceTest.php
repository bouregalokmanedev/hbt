<?php

namespace Tests\Feature\Domains\AI;

use App\Domains\AI\DTOs\MentorAdaptation;
use App\Domains\AI\DTOs\MentorStudentProfile;
use App\Domains\AI\Enums\MentorLearningLevel;
use App\Domains\AI\Services\MentorAdaptationService;
use PHPUnit\Framework\TestCase;

final class MentorAdaptationServiceTest extends TestCase
{
    private MentorAdaptationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new MentorAdaptationService();
    }

    public function test_it_returns_foundational_explanations_for_beginner_learners(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::BEGINNER,
            overallProgress: 25,
            quizPerformance: 50,
            assessmentPerformance: 50,
            diagnosticPerformance: 0,
        );

        $adaptation = $this->service->build($profile);

        $this->assertInstanceOf(
            MentorAdaptation::class,
            $adaptation
        );

        $this->assertSame(
            'beginner',
            $adaptation->learningLevel
        );

        $this->assertSame(
            'foundational',
            $adaptation->explanationDepth
        );
    }

    public function test_it_returns_moderate_explanations_for_intermediate_learners(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            overallProgress: 65,
            quizPerformance: 75,
            assessmentPerformance: 75,
            diagnosticPerformance: 75,
        );

        $adaptation = $this->service->build($profile);

        $this->assertSame(
            'intermediate',
            $adaptation->learningLevel
        );

        $this->assertSame(
            'moderate',
            $adaptation->explanationDepth
        );
    }

    public function test_it_returns_deep_explanations_for_advanced_learners(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::ADVANCED,
            overallProgress: 90,
            quizPerformance: 95,
            assessmentPerformance: 92,
            diagnosticPerformance: 94,
        );

        $adaptation = $this->service->build($profile);

        $this->assertSame(
            'advanced',
            $adaptation->learningLevel
        );

        $this->assertSame(
            'deep',
            $adaptation->explanationDepth
        );
    }

    public function test_it_prioritizes_remediation_for_low_overall_progress(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::BEGINNER,
            overallProgress: 30,
            quizPerformance: 80,
            assessmentPerformance: 80,
            diagnosticPerformance: 80,
        );

        $adaptation = $this->service->build($profile);

        $this->assertTrue(
            $adaptation->prioritizeRemediation
        );

        $this->assertSame(
            'remedial',
            $adaptation->teachingStrategy
        );

        $this->assertSame(
            'remedial',
            $adaptation->difficulty
        );
    }

    public function test_it_prioritizes_remediation_for_weak_quiz_performance(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            overallProgress: 70,
            quizPerformance: 50,
            assessmentPerformance: 80,
            diagnosticPerformance: 80,
        );

        $adaptation = $this->service->build($profile);

        $this->assertTrue(
            $adaptation->prioritizeRemediation
        );

        $this->assertSame(
            'remedial',
            $adaptation->teachingStrategy
        );

        $this->assertSame(
            'remedial',
            $adaptation->difficulty
        );
    }

    public function test_it_prioritizes_remediation_for_weak_assessment_performance(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            overallProgress: 70,
            quizPerformance: 80,
            assessmentPerformance: 50,
            diagnosticPerformance: 80,
        );

        $adaptation = $this->service->build($profile);

        $this->assertTrue(
            $adaptation->prioritizeRemediation
        );

        $this->assertSame(
            'remedial',
            $adaptation->teachingStrategy
        );

        $this->assertSame(
            'remedial',
            $adaptation->difficulty
        );
    }

    public function test_it_does_not_prioritize_remediation_when_performance_is_healthy(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            overallProgress: 70,
            quizPerformance: 75,
            assessmentPerformance: 80,
            diagnosticPerformance: 80,
        );

        $adaptation = $this->service->build($profile);

        $this->assertFalse(
            $adaptation->prioritizeRemediation
        );
    }

    public function test_it_enables_socratic_questioning_for_intermediate_learners(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            overallProgress: 70,
            quizPerformance: 75,
            assessmentPerformance: 80,
            diagnosticPerformance: 80,
        );

        $adaptation = $this->service->build($profile);

        $this->assertTrue(
            $adaptation->useSocraticQuestioning
        );

        $this->assertSame(
            'socratic',
            $adaptation->teachingStrategy
        );
    }

    public function test_it_does_not_use_socratic_questioning_for_beginners(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::BEGINNER,
            overallProgress: 50,
            quizPerformance: 65,
            assessmentPerformance: 65,
            diagnosticPerformance: 65,
        );

        $adaptation = $this->service->build($profile);

        $this->assertFalse(
            $adaptation->useSocraticQuestioning
        );
    }

    public function test_it_does_not_use_socratic_questioning_when_remediation_is_required(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            overallProgress: 30,
            quizPerformance: 75,
            assessmentPerformance: 75,
            diagnosticPerformance: 75,
        );

        $adaptation = $this->service->build($profile);

        $this->assertTrue(
            $adaptation->prioritizeRemediation
        );

        $this->assertFalse(
            $adaptation->useSocraticQuestioning
        );
    }

    public function test_it_enables_diagnostic_scaffolding_when_diagnostic_data_exists(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            overallProgress: 70,
            quizPerformance: 75,
            assessmentPerformance: 75,
            diagnosticPerformance: 70,
        );

        $adaptation = $this->service->build($profile);

        $this->assertTrue(
            $adaptation->useDiagnosticScaffolding
        );
    }

    public function test_it_encourages_mastery_for_high_progress_learners(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::ADVANCED,
            overallProgress: 85,
            quizPerformance: 90,
            assessmentPerformance: 90,
            diagnosticPerformance: 90,
        );

        $adaptation = $this->service->build($profile);

        $this->assertTrue(
            $adaptation->encourageMastery
        );

        $this->assertSame(
            'challenging',
            $adaptation->difficulty
        );
    }

    public function test_it_does_not_encourage_mastery_when_remediation_is_required(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::ADVANCED,
            overallProgress: 85,
            quizPerformance: 50,
            assessmentPerformance: 90,
            diagnosticPerformance: 90,
        );

        $adaptation = $this->service->build($profile);

        $this->assertTrue(
            $adaptation->prioritizeRemediation
        );

        $this->assertFalse(
            $adaptation->encourageMastery
        );

        $this->assertSame(
            'remedial',
            $adaptation->difficulty
        );
    }

    public function test_it_uses_current_level_difficulty_for_normal_learners(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            overallProgress: 65,
            quizPerformance: 75,
            assessmentPerformance: 75,
            diagnosticPerformance: 75,
        );

        $adaptation = $this->service->build($profile);

        $this->assertSame(
            'current_level',
            $adaptation->difficulty
        );
    }

    public function test_it_focuses_on_weak_concepts_when_remediation_is_required(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::BEGINNER,
            overallProgress: 30,
            quizPerformance: 50,
            assessmentPerformance: 70,
            diagnosticPerformance: 70,
        );

        $adaptation = $this->service->build($profile);

        $this->assertContains(
            'weak_concepts',
            $adaptation->focusAreas
        );
    }

    public function test_it_focuses_on_the_current_course(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            courseId: 'course-123',
            overallProgress: 70,
            quizPerformance: 75,
            assessmentPerformance: 75,
            diagnosticPerformance: 75,
        );

        $adaptation = $this->service->build($profile);

        $this->assertContains(
            'current_course',
            $adaptation->focusAreas
        );
    }

    public function test_it_focuses_on_the_current_lesson(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            courseId: 'course-123',
            overallProgress: 70,
            courseProgress: 70,
            lessonProgress: 50,
            quizPerformance: 75,
            assessmentPerformance: 75,
            diagnosticPerformance: 75,
        );

        $adaptation = $this->service->build($profile);

        $this->assertContains(
            'current_lesson',
            $adaptation->focusAreas
        );
    }

    public function test_it_focuses_on_diagnostic_reasoning_when_diagnostic_data_exists(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            overallProgress: 70,
            quizPerformance: 75,
            assessmentPerformance: 75,
            diagnosticPerformance: 75,
        );

        $adaptation = $this->service->build($profile);

        $this->assertContains(
            'diagnostic_reasoning',
            $adaptation->focusAreas
        );
    }

    public function test_it_remains_deterministic_for_the_same_profile(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            courseId: 'course-123',
            overallProgress: 70,
            courseProgress: 70,
            lessonProgress: 60,
            quizPerformance: 75,
            assessmentPerformance: 80,
            diagnosticPerformance: 78,
        );

        $first = $this->service->build($profile);
        $second = $this->service->build($profile);

        $this->assertSame(
            $first->toArray(),
            $second->toArray()
        );
    }

    public function test_it_does_not_mutate_the_student_profile(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::INTERMEDIATE,
            courseId: 'course-123',
            overallProgress: 70,
            courseProgress: 70,
            lessonProgress: 60,
            quizPerformance: 75,
            assessmentPerformance: 80,
            diagnosticPerformance: 78,
        );

        $before = $profile->toArray();

        $this->service->build($profile);

        $after = $profile->toArray();

        $this->assertSame(
            $before,
            $after
        );
    }

    public function test_it_serializes_the_adaptation_to_an_array(): void
    {
        $profile = $this->profile(
            level: MentorLearningLevel::ADVANCED,
            overallProgress: 90,
            quizPerformance: 95,
            assessmentPerformance: 92,
            diagnosticPerformance: 94,
        );

        $adaptation = $this->service->build($profile);

        $data = $adaptation->toArray();

        $this->assertArrayHasKey(
            'learning_level',
            $data
        );

        $this->assertArrayHasKey(
            'explanation_depth',
            $data
        );

        $this->assertArrayHasKey(
            'teaching_strategy',
            $data
        );

        $this->assertArrayHasKey(
            'difficulty',
            $data
        );

        $this->assertArrayHasKey(
            'use_socratic_questioning',
            $data
        );

        $this->assertArrayHasKey(
            'use_diagnostic_scaffolding',
            $data
        );

        $this->assertArrayHasKey(
            'prioritize_remediation',
            $data
        );

        $this->assertArrayHasKey(
            'encourage_mastery',
            $data
        );

        $this->assertArrayHasKey(
            'focus_areas',
            $data
        );
    }

    private function profile(
        MentorLearningLevel $level = MentorLearningLevel::BEGINNER,
        ?string $userId = 'user-123',
        ?string $courseId = 'course-123',
        int $coursesEnrolled = 1,
        int $coursesCompleted = 0,
        float $averageQuizScore = 0,
        float $averageAssessmentScore = 0,
        float $averageDiagnosticScore = 0,
        int $lessonsCompleted = 0,
        int $lessonsInProgress = 1,
        int $overallProgress = 0,
        int $courseProgress = 50,
        int $lessonProgress = 50,
        int $quizPerformance = 0,
        int $assessmentPerformance = 0,
        int $diagnosticPerformance = 0,
        int $coursesStarted = 1,
        array $weakAreas = [],
        array $strongAreas = [],
        array $recentFailures = [],
        array $recentSuccesses = [],
    ): MentorStudentProfile {
        return new MentorStudentProfile(
            userId: $userId,
            courseId: $courseId,
            level: $level,
            coursesEnrolled: $coursesEnrolled,
            coursesCompleted: $coursesCompleted,
            averageQuizScore: $averageQuizScore,
            averageAssessmentScore: $averageAssessmentScore,
            averageDiagnosticScore: $averageDiagnosticScore,
            lessonsCompleted: $lessonsCompleted,
            lessonsInProgress: $lessonsInProgress,
            overallProgress: $overallProgress,
            courseProgress: $courseProgress,
            lessonProgress: $lessonProgress,
            quizPerformance: $quizPerformance,
            assessmentPerformance: $assessmentPerformance,
            diagnosticPerformance: $diagnosticPerformance,
            coursesStarted: $coursesStarted,
            weakAreas: $weakAreas,
            strongAreas: $strongAreas,
            recentFailures: $recentFailures,
            recentSuccesses: $recentSuccesses,
        );
    }
}