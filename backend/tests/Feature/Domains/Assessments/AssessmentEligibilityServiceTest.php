<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Services\AssessmentEligibilityService;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;

function assessmentEligibilityService(): AssessmentEligibilityService
{
    return app(AssessmentEligibilityService::class);
}

it('does not allow a draft assessment', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'status' => 'draft',
    ]);

    expect(
        assessmentEligibilityService()->isEligible(
            $assessment,
            $user
        )
    )->toBeFalse();
});

it('allows a published assessment with no requirements', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    expect(
        assessmentEligibilityService()->isEligible(
            $assessment,
            $user
        )
    )->toBeTrue();
});

it('requires all course lessons to be completed', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

   $lessons = collect(range(1, 3))->map(
    fn (int $position) => Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => $position,
    ])
);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    expect(
        assessmentEligibilityService()->isEligible(
            $assessment,
            $user
        )
    )->toBeFalse();
});

it('allows eligibility when all course lessons are completed', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

  $lessons = collect(range(1, 3))->map(
    fn (int $position) => Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => $position,
    ])
);

    foreach ($lessons as $lesson) {
        $lesson->progressForUser()->create([
            'user_id' => $user->id,
            'progress_percentage' => 100,
            'completed_at' => now(),
        ]);
    }

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    expect(
        assessmentEligibilityService()->isEligible(
            $assessment,
            $user
        )
    )->toBeTrue();
});
it('requires assigned quizzes to meet the minimum score', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 70,
        'required_scenarios' => 0,
    ]);

    $quiz = Quiz::factory()->create();

    $assessment->quizzes()->attach($quiz->id, [
        'position' => 1,
        'is_required' => true,
    ]);

    QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'status' => 'submitted',
        'percentage' => 65,
    ]);

    expect(
        assessmentEligibilityService()->isEligible(
            $assessment,
            $user
        )
    )->toBeFalse();
});

it('allows quiz eligibility when the required score is reached', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 70,
        'required_scenarios' => 0,
    ]);

    $quiz = Quiz::factory()->create();

    $assessment->quizzes()->attach($quiz->id, [
        'position' => 1,
        'is_required' => true,
    ]);

    QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'status' => 'submitted',
        'percentage' => 70,
    ]);

    expect(
        assessmentEligibilityService()->isEligible(
            $assessment,
            $user
        )
    )->toBeTrue();
});
it('requires the configured number of passed diagnostic scenarios', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 2,
    ]);

    $scenarios = DiagnosticScenario::factory()
        ->count(2)
        ->create([
            'course_id' => $course->id,
        ]);

    foreach ($scenarios as $position => $scenario) {
        $assessment->diagnosticScenarios()->attach(
            $scenario->id,
            [
                'position' => $position + 1,
                'is_required' => true,
            ]
        );
    }

    DiagnosticScenarioAttempt::factory()->create([
        'diagnostic_scenario_id' => $scenarios[0]->id,
        'user_id' => $user->id,
        'status' => 'submitted',
        'passed' => true,
        'score' => 85,
    ]);

    expect(
        assessmentEligibilityService()->isEligible(
            $assessment,
            $user
        )
    )->toBeFalse();
});

it('allows eligibility when enough diagnostic scenarios are passed', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 2,
    ]);

    $scenarios = DiagnosticScenario::factory()
        ->count(2)
        ->create([
            'course_id' => $course->id,
        ]);

    foreach ($scenarios as $position => $scenario) {
        $assessment->diagnosticScenarios()->attach(
            $scenario->id,
            [
                'position' => $position + 1,
                'is_required' => true,
            ]
        );

        DiagnosticScenarioAttempt::factory()->create([
            'diagnostic_scenario_id' => $scenario->id,
            'user_id' => $user->id,
            'status' => 'submitted',
            'passed' => true,
            'score' => 85,
        ]);
    }

    expect(
        assessmentEligibilityService()->isEligible(
            $assessment,
            $user
        )
    )->toBeTrue();
});
it('returns eligibility evidence', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    $result = assessmentEligibilityService()->evaluate(
        $assessment,
        $user
    );

    expect($result)
        ->toHaveKey('eligible')
        ->toHaveKey('lessons')
        ->toHaveKey('quizzes')
        ->toHaveKey('scenarios');

    expect($result['eligible'])->toBeTrue();
});