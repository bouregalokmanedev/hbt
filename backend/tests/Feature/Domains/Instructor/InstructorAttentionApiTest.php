<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttemptAnswer;
use App\Domains\StudentAssessments\Actions\StartAssessmentAction;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
    Role::findOrCreate('Student', 'web');
});

function attentionOwnedCourse(User $instructor): Course
{
    return Course::factory()->create([
        'status' => 'published',
        'instructor_id' => $instructor->id,
    ]);
}

function attentionEnrol(User $student, Course $course): void
{
    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);
}

function attentionAssessmentIn(Course $course): Assessment
{
    return Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);
}

/** An answer waiting on a human grade. */
function attentionPendingAnswer(Course $course, User $student): AssessmentAttemptAnswer
{
    $attempt = app(StartAssessmentAction::class)->execute(
        attentionAssessmentIn($course),
        $student,
    );

    return AssessmentAttemptAnswer::factory()->create([
        'assessment_attempt_id' => $attempt->id,
        'evaluation_status' => 'pending_review',
        'answer' => ['text' => 'An essay awaiting a human grade.'],
    ]);
}

/** Trip the tab-switch limit so the attempt is flagged for review. */
function attentionFlaggedAttempt(Tests\TestCase $test, Course $course, User $student): string
{
    $attempt = app(StartAssessmentAction::class)->execute(
        attentionAssessmentIn($course),
        $student,
    );

    foreach (range(1, 3) as $ignored) {
        $test->actingAs($student)->postJson(
            "/api/v1/student/assessment-attempts/{$attempt->id}/integrity",
            ['event_type' => 'tab_blur'],
        )->assertOk();
    }

    return $attempt->id;
}

it('requires authentication', function () {
    $this->getJson('/api/v1/instructor/attention')->assertUnauthorized();
});

it('is reserved for instructors', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/instructor/attention')
        ->assertForbidden();
});

it('aggregates both queues across every one of the instructor courses', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    $reviewStudent = User::factory()->create();
    $flaggedStudent = User::factory()->create();

    $courseOne = attentionOwnedCourse($instructor);
    $courseTwo = attentionOwnedCourse($instructor);

    attentionEnrol($reviewStudent, $courseOne);
    attentionEnrol($flaggedStudent, $courseTwo);

    attentionPendingAnswer($courseOne, $reviewStudent);
    attentionFlaggedAttempt($this, $courseTwo, $flaggedStudent);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/attention');

    $response->assertOk()
        ->assertJsonPath('data.counts.pending_reviews', 1)
        ->assertJsonPath('data.counts.flagged_attempts', 1)
        ->assertJsonPath('data.counts.total', 2);

    expect($response->json('data.pending_reviews.0.course_title'))->toBe($courseOne->title)
        ->and($response->json('data.pending_reviews.0.course_id'))->toBe($courseOne->id)
        ->and($response->json('data.flagged_attempts.0.course_title'))->toBe($courseTwo->title)
        ->and($response->json('data.flagged_attempts.0.course_id'))->toBe($courseTwo->id);
});

it('never surfaces work belonging to another instructor', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    $other = User::factory()->create();
    $other->assignRole('Instructor');

    $student = User::factory()->create();
    $otherCourse = attentionOwnedCourse($other);
    attentionEnrol($student, $otherCourse);
    attentionPendingAnswer($otherCourse, $student);

    $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/attention')
        ->assertOk()
        ->assertJsonPath('data.counts.total', 0)
        ->assertJsonCount(0, 'data.pending_reviews')
        ->assertJsonCount(0, 'data.flagged_attempts');
});

it('returns an empty queue for an instructor with no courses', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/attention')
        ->assertOk()
        ->assertJsonPath('data.counts.pending_reviews', 0)
        ->assertJsonPath('data.counts.flagged_attempts', 0)
        ->assertJsonPath('data.counts.total', 0);
});
