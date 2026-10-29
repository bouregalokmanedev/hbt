<?php

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Enums\EnrollmentStatus;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Build a published course whose only remaining requirement is the final
 * assessment. Lesson and section evidence is already complete.
 *
 * @return array{user: User, course: Course, section: Section, lesson: Lesson, assessment: Assessment, correct_option: QuizQuestionOption}
 */
function journeyCourseWithFinalAssessment(): array
{
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => 'published',
        'published_at' => now(),
    ]);

    $section = Section::factory()->published()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    $lesson = Lesson::factory()->published()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    LessonProgress::factory()->completed()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $user->id,
        'section_id' => $section->id,
        'progress_percentage' => 100,
        'time_spent' => 1200,
        'started_at' => now()->subDay(),
        'completed_at' => now()->subHour(),
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'published_at' => now(),
        'assessment_mode' => 'final',
        'is_required' => true,
        'minimum_score' => 70,
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
        'max_attempts' => 2,
    ]);

    $question = QuizQuestion::factory()->create([
        'type' => QuizQuestionType::SINGLE_CHOICE,
    ]);

    $correctOption = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $question->id,
        'is_correct' => true,
        'position' => 1,
    ]);

    QuizQuestionOption::factory()->create([
        'quiz_question_id' => $question->id,
        'is_correct' => false,
        'position' => 2,
    ]);

    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
        'position' => 1,
        'points' => 100,
    ]);

    return compact('user', 'course', 'section', 'lesson', 'assessment', 'correctOption');
}

it('certifies and completes a course through the journey endpoint end to end', function () {
    [
        'user' => $user,
        'course' => $course,
        'lesson' => $lesson,
        'assessment' => $assessment,
        'correctOption' => $correctOption,
    ] = journeyCourseWithFinalAssessment();

    $this->actingAs($user)
        ->getJson("/api/v1/courses/{$course->id}/journey")
        ->assertOk()
        ->assertJsonPath('data.pass.passed', false)
        ->assertJsonPath('data.pass.certificate_ready', false)
        ->assertJsonPath('data.pass.lessons.required', 1)
        ->assertJsonPath('data.pass.lessons.completed', 1)
        ->assertJsonPath('data.pass.next_step.type', 'assessment')
        ->assertJsonPath('data.pass.next_step.id', $assessment->id)
        ->assertJsonPath('data.enrollment.status', 'active')
        ->assertJsonPath('data.progress.completed_at', null)
        ->assertJsonPath('data.pass.certificate', null);

    expect(Certificate::query()->count())->toBe(0);

    $attemptId = $this->actingAs($user)
        ->postJson("/api/v1/assessments/{$assessment->id}/attempts")
        ->assertCreated()
        ->json('data.id');

    $this->actingAs($user)
        ->postJson("/api/v1/assessments/{$assessment->id}/attempts/{$attemptId}/submit", [
            'answers' => [
                [
                    'question_id' => $assessment->questions()->first()->id,
                    'option_ids' => [$correctOption->id],
                ],
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('data.score', '100.00')
        ->assertJsonPath('data.passed', true);

    $certificate = Certificate::query()
        ->where('user_id', $user->id)
        ->where('course_id', $course->id)
        ->first();

    expect($certificate)->not->toBeNull()
        ->and($certificate->assessment_result_id)->not->toBeNull()
        ->and($certificate->enrollment_id)
        ->toBe(Enrollment::query()->where('user_id', $user->id)->where('course_id', $course->id)->value('id'));

    $enrollment = Enrollment::query()
        ->where('user_id', $user->id)
        ->where('course_id', $course->id)
        ->first();

    expect($enrollment->status)->toBe(EnrollmentStatus::COMPLETED)
        ->and($enrollment->completed_at)->not->toBeNull();

    $this->actingAs($user)
        ->getJson("/api/v1/courses/{$course->id}/journey")
        ->assertOk()
        ->assertJsonPath('data.pass.passed', true)
        ->assertJsonPath('data.pass.certificate_ready', true)
        ->assertJsonPath('data.pass.certificate.id', $certificate->id)
        ->assertJsonPath('data.pass.next_step.type', 'certificate')
        ->assertJsonPath('data.pass.next_step.path', '/certificates')
        ->assertJsonPath('data.pass.final_assessment.passed', true)
        ->assertJsonPath('data.pass.lessons.next', null)
        ->assertJsonPath('data.enrollment.status', 'completed')
        ->assertJsonPath('data.progress.completed_at', $enrollment->completed_at?->toISOString());

    $this->actingAs($user)
        ->getJson("/api/v1/courses/{$course->id}/gradebook")
        ->assertOk()
        ->assertJsonPath('data.course_passed', true)
        ->assertJsonPath('data.certificate_ready', true)
        ->assertJsonPath('data.enrollment_status', 'completed');

    // The journey is stable: repeated reads do not mint another certificate
    // or move the completion timestamp.
    $this->actingAs($user)
        ->getJson("/api/v1/courses/{$course->id}/journey")
        ->assertOk();

    expect(Certificate::query()->where('user_id', $user->id)->where('course_id', $course->id)->count())->toBe(1)
        ->and($enrollment->fresh()->completed_at?->toISOString())->toBe($enrollment->completed_at?->toISOString())
        ->and($lesson->fresh())->not->toBeNull();
});

it('keeps the journey gated for learners without full course access', function () {
    [
        'course' => $course,
    ] = journeyCourseWithFinalAssessment();

    $stranger = User::factory()->create();

    $this->actingAs($stranger)
        ->getJson("/api/v1/courses/{$course->id}/journey")
        ->assertForbidden();
});

it('orders the next lesson by section before lesson position', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => 'published',
        'published_at' => now(),
    ]);

    $firstSection = Section::factory()->published()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);
    $secondSection = Section::factory()->published()->create([
        'course_id' => $course->id,
        'position' => 2,
    ]);

    $firstLesson = Lesson::factory()->published()->create([
        'section_id' => $firstSection->id,
        'position' => 1,
    ]);
    $secondLesson = Lesson::factory()->published()->create([
        'section_id' => $firstSection->id,
        'position' => 2,
    ]);
    $laterSectionLesson = Lesson::factory()->published()->create([
        'section_id' => $secondSection->id,
        'position' => 1,
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    LessonProgress::factory()->completed()->create([
        'user_id' => $user->id,
        'lesson_id' => $firstLesson->id,
    ]);

    $this->actingAs($user)
        ->getJson("/api/v1/courses/{$course->id}/journey")
        ->assertOk()
        ->assertJsonPath('data.pass.next_step.type', 'lesson')
        ->assertJsonPath('data.pass.next_step.id', $secondLesson->id)
        ->assertJsonPath('data.pass.lessons.next.id', $secondLesson->id)
        ->assertJsonPath('data.pass.lessons.completed', 1);

    // The lesson in the next section is still locked until the current
    // section is finished.
    $this->actingAs($user)
        ->getJson("/api/v1/lessons/{$laterSectionLesson->id}")
        ->assertForbidden();
});

it('repairs stored completion when the journey is the first page after a pass', function () {
    [
        'user' => $user,
        'course' => $course,
        'assessment' => $assessment,
    ] = journeyCourseWithFinalAssessment();

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::PASSED,
        'score' => 90,
        'passed' => true,
        'completed_at' => now(),
    ]);

    AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $user->id,
        'score' => 90,
        'passed' => true,
        'completed_at' => now(),
    ]);

    // Simulate legacy data: the learner passed everything, but no progress
    // sync ever ran, so the enrollment is still active.
    expect(CourseProgress::query()->count())->toBe(0)
        ->and(Enrollment::query()->where('user_id', $user->id)->value('status'))
        ->toBe(EnrollmentStatus::ACTIVE);

    $this->actingAs($user)
        ->getJson("/api/v1/courses/{$course->id}/journey")
        ->assertOk()
        ->assertJsonPath('data.pass.passed', true)
        ->assertJsonPath('data.pass.certificate_ready', true)
        ->assertJsonPath('data.enrollment.status', 'completed')
        ->assertJsonPath(
            'data.enrollment.completed_at',
            fn ($value) => $value !== null,
        )
        ->assertJsonPath(
            'data.progress.completed_at',
            fn ($value) => $value !== null,
        );

    expect(CourseProgress::query()
        ->where('user_id', $user->id)
        ->where('course_id', $course->id)
        ->value('completed_at'))
        ->not->toBeNull()
        ->and(Enrollment::query()->where('user_id', $user->id)->value('status'))
        ->toBe(EnrollmentStatus::COMPLETED);

    // The journey repairs progress; certificates are still minted by the
    // assessment event, not by a page read.
    expect(Certificate::query()->count())->toBe(0);
});
