<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Domains\StudentAssessments\DTOs\SaveResponseData;
use App\Domains\StudentAssessments\Services\ResponseService;
use App\Domains\StudentAssessments\Actions\StartAssessmentAction;
use App\Domains\StudentAssessments\Actions\SubmitAssessmentAction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function accessibleAssessment(User $user, array $overrides = []): Assessment
{
    $course = \App\Models\Course::factory()->create(['status' => 'published']);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    return Assessment::factory()->create(array_merge(
        ['course_id' => $course->id, 'status' => 'published', 'required_quiz_score' => 0, 'required_scenarios' => 0],
        $overrides,
    ));
}

it('full student journey: available -> start -> autosave -> navigation -> submit -> competency -> recommendation -> history', function () {
    $user = User::factory()->create();
    $course = \App\Models\Course::factory()->create(['status' => 'published']);
    $section = \App\Models\Section::factory()->create(['course_id' => $course->id]);
    $lesson = \App\Models\Lesson::factory()->create(['section_id' => $section->id]);
    
    // Mark lesson as completed for eligibility
    $lesson->progressForUser()->create([
        'user_id' => $user->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);
    
    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
        'minimum_score' => 70,
    ]);
    // Enrollment required for listAvailable (course.enrollments)
    \App\Models\Enrollment::factory()->create(['user_id' => $user->id, 'course_id' => $course->id, 'status' => 'active']);

    // Create 2 questions for scoring
    $q1 = QuizQuestion::factory()->create();
    $q1OptCorrect = QuizQuestionOption::factory()->create(['quiz_question_id' => $q1->id, 'is_correct' => true, 'position' => 1]);
    $q1OptWrong = QuizQuestionOption::factory()->create(['quiz_question_id' => $q1->id, 'is_correct' => false, 'position' => 2]);
    $q2 = QuizQuestion::factory()->create();
    $q2OptCorrect = QuizQuestionOption::factory()->create(['quiz_question_id' => $q2->id, 'is_correct' => true, 'position' => 1]);
    $q2OptWrong = QuizQuestionOption::factory()->create(['quiz_question_id' => $q2->id, 'is_correct' => false, 'position' => 2]);

    AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'quiz_question_id' => $q1->id, 'position' => 1, 'points' => 50]);
    AssessmentQuestion::factory()->create(['assessment_id' => $assessment->id, 'quiz_question_id' => $q2->id, 'position' => 2, 'points' => 50]);

    // List available — should include our assessment with eligibility true
    $list = app(\App\Domains\StudentAssessments\Actions\ListAvailableAssessmentsAction::class)->execute($user);
    $found = $list->firstWhere(fn ($item) => $item['assessment']->id === $assessment->id);
    expect($found)->not->toBeNull();
    if ($found) {
        expect($found['eligibility']['eligible'])->toBeTrue();
    }

    // Get details
    $details = app(\App\Domains\StudentAssessments\Actions\GetAssessmentDetailsAction::class)->execute($assessment, $user);
    expect($details['questions_count'])->toBe(2);

    // Start attempt — student_id from auth()->id()
    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);
    expect($attempt->status->value)->toBe('in_progress');
    expect($attempt->user_id)->toBe($user->id);
    expect($attempt->expires_at)->not->toBeNull();

    // Second start should return same attempt (idempotent)
    $attempt2 = app(StartAssessmentAction::class)->execute($assessment, $user);
    expect($attempt2->id)->toBe($attempt->id);

    // Resume
    $resumed = app(\App\Domains\StudentAssessments\Actions\ResumeAssessmentAction::class)->execute($attempt, $user);
    expect($resumed->id)->toBe($attempt->id);

    // Autosave responses with confidence + flag
    $responseService = app(ResponseService::class);

    $r1 = $responseService->save(new SaveResponseData(
        attemptId: $attempt->id,
        questionId: $q1->id,
        answer: ['selected_option_ids' => [$q1OptCorrect->id]],
        confidenceLevel: 'very_confident',
        isFlagged: false,
        timeSpentSeconds: 30,
    ), $user);

    expect($r1->confidence_level->value)->toBe('very_confident');
    expect($r1->answer['selected_option_ids'])->toContain($q1OptCorrect->id);

    // Flag q2 then answer
    $flagged = $responseService->flag($attempt->id, $q2->id, $user, true);
    expect($flagged->is_flagged)->toBeTrue();

    $r2 = $responseService->save(new SaveResponseData(
        attemptId: $attempt->id,
        questionId: $q2->id,
        answer: ['selected_option_ids' => [$q2OptWrong->id]],
        confidenceLevel: 'confident',
        isFlagged: true,
        timeSpentSeconds: 45,
    ), $user);

    expect($r2->is_flagged)->toBeTrue();

    // Navigation
    $nav = $responseService->getNavigation($attempt->fresh());
    expect($nav['total'])->toBe(2);
    expect($nav['answered_count'])->toBe(2);
    expect($nav['flagged_count'])->toBe(1);
    expect($nav['progress_percentage'])->toBe(100);

    // Submit — should evaluate and create competency + recommendation
    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user);
    expect($result['scoring']['score'])->toBe(50.0);
    expect($result['scoring']['passed'])->toBeFalse();
    expect($result['student_result']->proficiency_level->value)->toBe('beginner'); // 50% => beginner per thresholds
    expect($result['competency_results'])->toHaveCount(1);
    expect($result['recommendations'])->not->toBeEmpty();

    // Review result
    $review = app(\App\Domains\StudentAssessments\Actions\ReviewAssessmentResultAction::class)->execute($attempt->fresh(), $user);
    expect($review)->not->toBeNull();
    expect($review->id)->toBe($result['student_result']->id);

    // Get competencies
    $comps = app(\App\Domains\StudentAssessments\Actions\GetCompetencyResultsAction::class)->execute($attempt->fresh(), $user);
    expect($comps)->toHaveCount(1);

    // Get recommendations
    $recs = app(\App\Domains\StudentAssessments\Actions\GetRecommendationsAction::class)->execute($attempt->fresh(), $user);
    expect($recs)->not->toBeEmpty();

    // History
    $history = app(\App\Domains\StudentAssessments\Actions\GetAssessmentHistoryAction::class)->execute($user);
    expect($history->total())->toBeGreaterThan(0);

    // Abandon fresh attempt
    $assessment2 = accessibleAssessment($user);
    $attempt3 = app(StartAssessmentAction::class)->execute($assessment2, $user);
    $abandoned = app(\App\Domains\StudentAssessments\Actions\AbandonAssessmentAction::class)->execute($attempt3, $user);
    expect($abandoned->status->value)->toBe('expired');
});

it('denies start for an unpublished assessment at the access gate', function () {
    $user = User::factory()->create();
    $draft = accessibleAssessment($user, ['status' => 'draft']);

    expect(fn () => app(StartAssessmentAction::class)->execute($draft, $user))
        ->toThrow(\App\Domains\StudentAssessments\Exceptions\AssessmentAccessDeniedException::class);
});

it('save response validates question belongs to assessment', function () {
    $user = User::factory()->create();
    $assessment = accessibleAssessment($user);
    $q = QuizQuestion::factory()->create();
    QuizQuestionOption::factory()->create(['quiz_question_id' => $q->id, 'is_correct' => true]);
    // q not attached to assessment
    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);

    expect(fn () => app(ResponseService::class)->save(new SaveResponseData(attemptId: $attempt->id, questionId: $q->id, answer: ['selected_option_ids' => []]), $user))
        ->toThrow(\LogicException::class);
});

it('student routes enforce auth->id as student_id', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $assessment = accessibleAssessment($owner);
    $attempt = app(StartAssessmentAction::class)->execute($assessment, $owner);

    // Other user cannot resume
    expect(fn () => app(\App\Domains\StudentAssessments\Actions\ResumeAssessmentAction::class)->execute($attempt, $other))
        ->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
});
