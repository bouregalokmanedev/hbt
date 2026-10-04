<?php

use App\Domains\Progression\Models\InstructorXpTransaction;
use App\Domains\Progression\Models\StudentXpTransaction;
use App\Domains\Progression\Services\StudentProgressionService;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function enrollmentXpOwnedCourse(?User $instructor = null): Course
{
    $instructor ??= User::factory()->create();
    $instructor->assignRole('Instructor');

    return Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);
}

/** Enrol through the real HTTP path — the only one production uses. */
function enrollmentXpEnrol($test, User $student, Course $course): void
{
    Sanctum::actingAs($student);

    $test->postJson('/api/v1/enrollments', ['course_id' => $course->id])
        ->assertCreated();
}

it('awards the learner and the course owner when a student enrols', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = enrollmentXpOwnedCourse($instructor);

    $student = User::factory()->create();

    enrollmentXpEnrol($this, $student, $course);

    $studentAward = StudentXpTransaction::where('user_id', $student->id)->first();

    expect($studentAward)->not->toBeNull()
        ->and($studentAward->event)->toBe('course_enrolled')
        ->and($studentAward->xp)->toBeGreaterThanOrEqual(15)
        ->and($studentAward->xp)->toBeLessThanOrEqual(25);

    $instructorAward = InstructorXpTransaction::where('user_id', $instructor->id)->first();

    expect($instructorAward)->not->toBeNull()
        ->and($instructorAward->event)->toBe('student_enrolled')
        ->and($instructorAward->dedupe_key)->toBe($studentAward->dedupe_key);
});

it('never awards a different instructor for someone else enrolment', function () {
    $owner = User::factory()->create();
    $owner->assignRole('Instructor');
    $course = enrollmentXpOwnedCourse($owner);

    $bystander = User::factory()->create();
    $bystander->assignRole('Instructor');

    enrollmentXpEnrol($this, User::factory()->create(), $course);

    expect(InstructorXpTransaction::where('user_id', $bystander->id)->count())->toBe(0);
});

it('pays a fresh amount for every additional student', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = enrollmentXpOwnedCourse($instructor);

    enrollmentXpEnrol($this, User::factory()->create(), $course);
    enrollmentXpEnrol($this, User::factory()->create(), $course);

    expect(StudentXpTransaction::where('event', 'course_enrolled')->count())->toBe(2)
        ->and(InstructorXpTransaction::where('user_id', $instructor->id)->count())->toBe(2);
});

it('claims each enrolment award exactly once', function () {
    $student = User::factory()->create();
    $course = enrollmentXpOwnedCourse();

    enrollmentXpEnrol($this, $student, $course);

    $enrollment = Enrollment::query()
        ->where('user_id', $student->id)
        ->where('course_id', $course->id)
        ->firstOrFail();

    $profile = \App\Domains\Progression\Models\StudentProgressionProfile::where('user_id', $student->id)->firstOrFail();
    $totalXp = $profile->total_xp;

    $retry = app(StudentProgressionService::class)->award(
        $student,
        'course_enrolled',
        999,
        999,
        "enrollment:{$enrollment->id}",
    );

    expect($retry)->toBeNull()
        ->and(StudentXpTransaction::where('user_id', $student->id)->count())->toBe(1)
        ->and(
            \App\Domains\Progression\Models\StudentProgressionProfile::where('user_id', $student->id)->first()->total_xp
        )->toBe($totalXp);
});
