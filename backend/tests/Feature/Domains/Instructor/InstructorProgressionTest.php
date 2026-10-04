<?php

use App\Domains\Enrollments\Actions\CreateEnrollmentAction;
use App\Domains\Progression\Models\InstructorProgressionProfile;
use App\Domains\Progression\Models\InstructorXpTransaction;
use App\Domains\Progression\Models\StudentProgressionProfile;
use App\Domains\Progression\Models\StudentXpTransaction;
use App\Domains\Progression\Services\InstructorProgressionService;
use App\Enums\Courses\CourseStatus;
use App\Enums\LessonStatus;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
    Role::findOrCreate('Student', 'web');
});

function progressionInstructor(): User
{
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    return $instructor;
}

function progressionOwnedCourse(User $instructor, array $overrides = []): Course
{
    return Course::factory()->create(array_merge([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::PUBLISHED,
        'visibility' => 'public',
    ], $overrides));
}

/** The full recipe a course needs before it can be published. */
function progressionPublishableCourse(User $instructor): Course
{
    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::DRAFT,
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $section = Section::factory()->create(['course_id' => $course->id]);
    Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    return $course;
}

it('requires authentication', function () {
    $this->getJson('/api/v1/instructor/progression')->assertUnauthorized();
});

it('is reserved for instructors', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/instructor/progression')
        ->assertForbidden();
});

it('starts a brand new instructor at the first level', function () {
    $instructor = progressionInstructor();

    $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/progression')
        ->assertOk()
        ->assertJsonPath('data.level', 1)
        ->assertJsonPath('data.title', 'Contributor')
        ->assertJsonPath('data.total_xp', 0)
        ->assertJsonPath('data.current_streak', 0)
        ->assertJsonPath('data.progress_percent', 0)
        ->assertJsonCount(7, 'data.teaching_days')
        ->assertJsonCount(0, 'data.recent_awards');
});

it('awards the course owner when the course is published', function () {
    $instructor = progressionInstructor();
    $course = progressionPublishableCourse($instructor);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/courses/{$course->id}/publish")
        ->assertOk();

    $award = InstructorXpTransaction::where('user_id', $instructor->id)->first();

    expect($award)->not->toBeNull()
        ->and($award->event)->toBe('course_published')
        ->and($award->xp)->toBeGreaterThanOrEqual(100)
        ->and($award->xp)->toBeLessThanOrEqual(140)
        ->and($award->dedupe_key)->toBe("course-published:{$course->id}");

    $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/progression')
        ->assertOk()
        ->assertJsonPath('data.total_xp', $award->xp)
        ->assertJsonPath('data.recent_awards.0.event', 'course_published');
});

it('awards the course owner when a student enrols', function () {
    $instructor = progressionInstructor();
    $course = progressionOwnedCourse($instructor);

    $student = User::factory()->create();
    $student->assignRole('Student');

    $enrollment = app(CreateEnrollmentAction::class)->execute($student->id, $course);

    $award = InstructorXpTransaction::where('user_id', $instructor->id)->first();

    expect($award)->not->toBeNull()
        ->and($award->event)->toBe('student_enrolled')
        ->and($award->dedupe_key)->toBe("enrollment:{$enrollment->id}");

    $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/progression')
        ->assertOk()
        ->assertJsonPath('data.recent_awards.0.event', 'student_enrolled');
});

it('claims each teaching action exactly once', function () {
    $instructor = progressionInstructor();
    $service = app(InstructorProgressionService::class);

    $first = $service->award($instructor, 'course_published', 10, 10, 'course-published:abc');
    $second = $service->award($instructor, 'course_published', 999, 999, 'course-published:abc');

    expect($first)->not->toBeNull()
        ->and($second)->toBeNull()
        ->and(InstructorXpTransaction::where('user_id', $instructor->id)->count())->toBe(1)
        ->and(InstructorProgressionProfile::where('user_id', $instructor->id)->first()->total_xp)->toBe(10);
});

it('keeps instructor XP out of the student progression tables', function () {
    $instructor = progressionInstructor();

    app(InstructorProgressionService::class)->award(
        $instructor,
        'lesson_published',
        20,
        20,
        'lesson-published:abc',
    );

    expect(InstructorXpTransaction::where('user_id', $instructor->id)->count())->toBe(1)
        ->and(StudentXpTransaction::where('user_id', $instructor->id)->count())->toBe(0)
        ->and(StudentProgressionProfile::where('user_id', $instructor->id)->count())->toBe(0);
});

it('levels the instructor up as teaching XP accumulates', function () {
    $instructor = progressionInstructor();
    $service = app(InstructorProgressionService::class);

    $service->award($instructor, 'course_published', 100, 100, 'course-published:one');
    $service->award($instructor, 'course_published', 100, 100, 'course-published:two');

    $summary = $service->summaryFor($instructor);

    expect($summary['total_xp'])->toBe(200)
        ->and($summary['level'])->toBe(2)
        ->and($summary['title'])->toBe('Facilitator')
        ->and($summary['next_level_title'])->toBe('Mentor')
        ->and($summary['progress_percent'])->toBeGreaterThan(0)
        ->and($summary['progress_percent'])->toBeLessThan(100);
});

it('counts a teaching day only once no matter how many actions land', function () {
    $instructor = progressionInstructor();
    $service = app(InstructorProgressionService::class);

    $service->award($instructor, 'lesson_published', 5, 5, 'lesson-published:one');
    $service->award($instructor, 'lesson_published', 5, 5, 'lesson-published:two');

    $summary = $service->summaryFor($instructor);

    expect($summary['current_streak'])->toBe(1)
        ->and(collect($summary['teaching_days'])->where('active', true)->count())->toBe(1);
});
