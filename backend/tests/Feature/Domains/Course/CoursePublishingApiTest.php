<?php

use App\Enums\Courses\CourseStatus;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Section;
use App\Models\Lesson;
use App\Enums\SectionStatus;
use App\Enums\LessonStatus;
use App\Enums\UserRole;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);
beforeEach(function () {
    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Super Admin', 'web');
    Role::findOrCreate('Instructor', 'web');
});

it('publishes a valid course through the API', function () {
    $instructor = User::factory()->create();

    $instructor->assignRole('Instructor');

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::DRAFT,
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $response = $this
        ->actingAs($instructor)
        ->postJson("/api/v1/courses/{$course->id}/publish");

    $response
        ->assertOk()
        ->assertJsonPath('data.id', $course->id)
        ->assertJsonPath('data.status', CourseStatus::PUBLISHED->value);

    $course->refresh();

    expect($course->status)
        ->toBe(CourseStatus::PUBLISHED);
});
it('does not publish an invalid course through the API', function () {
    $instructor = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::DRAFT,
        'title' => 'Laravel Course',
        'description' => 'A complete Laravel course.',
        'duration_minutes' => 120,
        'thumbnail' => null,
        'published_at' => null,
    ]);

    $this
        ->actingAs($instructor)
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertStatus(422);

    expect($course->fresh()->status)
        ->toBe(CourseStatus::DRAFT)
        ->and($course->fresh()->published_at)
        ->toBeNull();
});
it('cannot publish an already published course through the API', function () {
    $instructor = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::PUBLISHED,
        'published_at' => now()->subDay(),
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $this
        ->actingAs($instructor)
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertStatus(409);

    expect($course->fresh()->status)
        ->toBe(CourseStatus::PUBLISHED);
});

it('cannot publish an archived course through the API', function () {
    $instructor = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::ARCHIVED,
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $this
        ->actingAs($instructor)
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertStatus(422);

    expect($course->fresh()->status)
        ->toBe(CourseStatus::ARCHIVED);
});

it('requires authentication to publish a course', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::DRAFT,
        'thumbnail' => 'media/course-thumbnail.jpg',
    ]);

    $this
        ->postJson("/api/v1/courses/{$course->id}/publish")
        ->assertUnauthorized();

    expect($course->fresh()->status)
        ->toBe(CourseStatus::DRAFT);
});