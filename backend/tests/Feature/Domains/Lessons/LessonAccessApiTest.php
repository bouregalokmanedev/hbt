<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use function Pest\Laravel\actingAs;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\SectionStatus;
use App\Enums\Lessonstatus;
use App\Models\Enrollment;
use App\Enums\EnrollmentStatus;

it('allows an actively enrolled student to access a published lesson', function () {
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

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    actingAs($student)
        ->getJson("/api/v1/lessons/{$lesson->id}")
        ->assertOk();
});
it('rejects an unauthenticated user from accessing a lesson', function () {
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

    $this->getJson("/api/v1/lessons/{$lesson->id}")
        ->assertUnauthorized();
});
it('rejects a user without an active enrollment', function () {
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

    actingAs($student)
        ->getJson("/api/v1/lessons/{$lesson->id}")
        ->assertForbidden();
});
it('rejects access to a draft lesson', function () {
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
        'status' => LessonStatus::DRAFT,
    ]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    actingAs($student)
        ->getJson("/api/v1/lessons/{$lesson->id}")
        ->assertForbidden();
});
it('rejects access to a lesson in a draft section', function () {
    $student = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'status' => SectionStatus::DRAFT,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    actingAs($student)
        ->getJson("/api/v1/lessons/{$lesson->id}")
        ->assertForbidden();
});
it('rejects access to a lesson in a draft course', function () {
    $student = User::factory()->create();

    $course = Course::factory()->create([
        'status' => CourseStatus::DRAFT,
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

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    actingAs($student)
        ->getJson("/api/v1/lessons/{$lesson->id}")
        ->assertForbidden();
});