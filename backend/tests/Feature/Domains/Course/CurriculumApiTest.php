<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('returns the complete course curriculum', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
        'status' => SectionStatus::PUBLISHED,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
        'status' => LessonStatus::PUBLISHED,
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson(
        "/api/v1/courses/{$course->id}/curriculum"
    );

    $response
        ->assertOk()
        ->assertJsonPath('data.course.id', $course->id)
        ->assertJsonPath('data.sections.0.id', $section->id)
        ->assertJsonPath(
            'data.sections.0.lessons.0.id',
            $lesson->id
        );
});

it('returns sections in position order', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $section2 = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 2,
        'status' => SectionStatus::PUBLISHED,
    ]);

    $section1 = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
        'status' => SectionStatus::PUBLISHED,
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson(
        "/api/v1/courses/{$course->id}/curriculum"
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.sections.0.id',
            $section1->id
        )
        ->assertJsonPath(
            'data.sections.1.id',
            $section2->id
        );
});

it('returns lessons in position order', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
        'status' => SectionStatus::PUBLISHED,
    ]);

    $lesson3 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 3,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $lesson1 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $lesson2 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
        'status' => LessonStatus::PUBLISHED,
    ]);

    Sanctum::actingAs($user);

    $response = $this->getJson(
        "/api/v1/courses/{$course->id}/curriculum"
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.sections.0.lessons.0.id',
            $lesson1->id
        )
        ->assertJsonPath(
            'data.sections.0.lessons.1.id',
            $lesson2->id
        )
        ->assertJsonPath(
            'data.sections.0.lessons.2.id',
            $lesson3->id
        );
});

it('does not expose a private course curriculum to guests', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PRIVATE,
    ]);

    $response = $this->getJson(
        "/api/v1/courses/{$course->id}/curriculum"
    );

    $response->assertNotFound();
});

it('lets guests explore a public course outline without leaking lesson content', function () {
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
        'is_free' => false,
        'price' => 75,
    ]);
    $section = Section::factory()->create(['course_id' => $course->id, 'status' => SectionStatus::PUBLISHED]);
    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
        'is_preview' => false,
        'content' => 'Paid content must not be in the outline.',
    ]);

    $this->getJson("/api/v1/courses/{$course->id}/curriculum")
        ->assertOk()
        ->assertJsonPath('data.sections.0.lessons.0.id', $lesson->id)
        ->assertJsonPath('data.sections.0.lessons.0.content', null)
        ->assertJsonMissing(['content' => 'Paid content must not be in the outline.']);
});

it('returns 404 for an unknown course', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $response = $this->getJson(
        '/api/v1/courses/00000000-0000-0000-0000-000000000000/curriculum'
    );

    $response->assertNotFound();
});
