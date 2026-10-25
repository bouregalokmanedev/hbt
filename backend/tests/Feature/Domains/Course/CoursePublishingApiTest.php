<?php

use App\Enums\Courses\CourseStatus;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Section;
use App\Models\Lesson;
use App\Enums\SectionStatus;
use App\Enums\LessonStatus;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);
beforeEach(function () {
    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Super Admin', 'web');
    Role::findOrCreate('Instructor', 'web');
});

function coursePublishingAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    return $admin;
}

it('does not allow an instructor to publish their own course', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::REVIEW,
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $this
        ->actingAs($instructor)
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertForbidden();

    expect($course->fresh()->status)->toBe(CourseStatus::REVIEW);
});

it('publishes a reviewed course as an admin', function () {
    $admin = coursePublishingAdmin();

    $course = Course::factory()->create([
        'status' => CourseStatus::REVIEW,
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $this
        ->actingAs($admin)
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertOk()
        ->assertJsonPath('data.id', $course->id)
        ->assertJsonPath('data.status', CourseStatus::PUBLISHED->value);

    expect($course->fresh()->status)->toBe(CourseStatus::PUBLISHED);
});

it('does not publish a draft course even for an admin', function () {
    $admin = coursePublishingAdmin();

    $course = Course::factory()->create([
        'status' => CourseStatus::DRAFT,
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $section = Section::factory()->create(['course_id' => $course->id]);
    Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $this
        ->actingAs($admin)
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertStatus(422);

    expect($course->fresh()->status)->toBe(CourseStatus::DRAFT);
});

it('does not publish an invalid reviewed course', function () {
    $admin = coursePublishingAdmin();

    $course = Course::factory()->create([
        'status' => CourseStatus::REVIEW,
        'thumbnail' => null,
        'published_at' => null,
    ]);

    $this
        ->actingAs($admin)
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertStatus(422);

    expect($course->fresh()->status)
        ->toBe(CourseStatus::REVIEW)
        ->and($course->fresh()->published_at)
        ->toBeNull();
});

it('cannot publish an already published course through the API', function () {
    $admin = coursePublishingAdmin();

    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'published_at' => now()->subDay(),
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $this
        ->actingAs($admin)
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertStatus(409);

    expect($course->fresh()->status)->toBe(CourseStatus::PUBLISHED);
});

it('cannot publish an archived course through the API', function () {
    $admin = coursePublishingAdmin();

    $course = Course::factory()->create([
        'status' => CourseStatus::ARCHIVED,
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $this
        ->actingAs($admin)
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertStatus(422);

    expect($course->fresh()->status)->toBe(CourseStatus::ARCHIVED);
});

it('requires authentication to publish a course', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::REVIEW,
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $this
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertUnauthorized();

    expect($course->fresh()->status)->toBe(CourseStatus::REVIEW);
});
