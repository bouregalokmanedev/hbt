<?php

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\EnrollmentStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

function lessonProgressScenario(): array
{
    $student = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'status' => SectionStatus::PUBLISHED,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    return [
        $student,
        $course,
        $section,
        $lesson,
    ];
}

function enrollLessonProgressStudent(
    User $student,
    Course $course,
    EnrollmentStatus $status = EnrollmentStatus::ACTIVE,
): Enrollment {
    return Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => $status,
    ]);
}

it('allows an actively enrolled student to complete a published lesson', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course
    );

    actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertCreated();
});

it('persists lesson progress for the authenticated student', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course
    );

    actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertCreated();

    expect(
        LessonProgress::query()
            ->where('user_id', $student->id)
            ->where('lesson_id', $lesson->id)
            ->exists()
    )->toBeTrue();
});

it('stores a completion timestamp', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course
    );

    actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertCreated();

    $progress = LessonProgress::query()
        ->where('user_id', $student->id)
        ->where('lesson_id', $lesson->id)
        ->firstOrFail();

    expect($progress->completed_at)
        ->not->toBeNull();
});

it('returns the lesson progress', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course
    );

    actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertCreated()
        ->assertJsonPath(
            'user_id',
            $student->id
        )
        ->assertJsonPath(
            'lesson_id',
            $lesson->id
        );
});

it('does not create duplicate progress when completing a lesson twice', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course
    );

    $firstResponse = actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertCreated();

    $secondResponse = actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertCreated();

    expect(
        LessonProgress::query()
            ->where('user_id', $student->id)
            ->where('lesson_id', $lesson->id)
            ->count()
    )->toBe(1);

    expect($secondResponse->json('id'))
        ->toBe($firstResponse->json('id'));
});

it('rejects a student without an enrollment', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertForbidden();

    expect(LessonProgress::query()->count())
        ->toBe(0);
});

it('rejects a student with a cancelled enrollment', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course,
        EnrollmentStatus::CANCELLED
    );

    actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertForbidden();

    expect(LessonProgress::query()->count())
        ->toBe(0);
});

it('rejects a student with a completed enrollment', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course,
        EnrollmentStatus::COMPLETED
    );

    actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertForbidden();

    expect(LessonProgress::query()->count())
        ->toBe(0);
});

it('rejects completion of a draft lesson', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course
    );

    $lesson->update([
        'status' => LessonStatus::DRAFT,
    ]);

    actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertForbidden();

    expect(LessonProgress::query()->count())
        ->toBe(0);
});

it('rejects completion of a lesson in a draft section', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course
    );

    $section->update([
        'status' => SectionStatus::DRAFT,
    ]);

    actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertForbidden();

    expect(LessonProgress::query()->count())
        ->toBe(0);
});

it('rejects completion of a lesson in an unpublished course', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course
    );

    $course->update([
        'status' => CourseStatus::DRAFT,
    ]);

    actingAs($student)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/complete"
        )
        ->assertForbidden();

    expect(LessonProgress::query()->count())
        ->toBe(0);
});

it('rejects an unauthenticated user', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    $response = $this->postJson(
        "/api/v1/lessons/{$lesson->id}/complete"
    );

    $response->assertUnauthorized();

    expect(LessonProgress::query()->count())
        ->toBe(0);
});
it('updates lesson progress for the authenticated student', function () {
    [$student, $course, $section, $lesson] =
        lessonProgressScenario();

    enrollLessonProgressStudent(
        $student,
        $course
    );

    actingAs($student)
        ->patchJson(
            "/api/v1/lessons/{$lesson->id}/progress",
            [
                'progress_percentage' => 25,
                'time_spent' => 120,
            ]
        )
        ->assertOk()
        ->assertJsonPath(
            'data.progress_percentage',
            25
        )
        ->assertJsonPath(
            'data.time_spent',
            120
        );

    $progress = LessonProgress::query()
        ->where('user_id', $student->id)
        ->where('lesson_id', $lesson->id)
        ->firstOrFail();

    expect($progress->progress_percentage)
        ->toBe(25)
        ->and($progress->time_spent)
        ->toBe(120)
        ->and($progress->started_at)
        ->not->toBeNull()
        ->and($progress->completed_at)
        ->toBeNull();
});