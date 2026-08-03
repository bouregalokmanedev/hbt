<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('returns the complete course curriculum', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
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
    ]);

    $section2 = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 2,
    ]);

    $section1 = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
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
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    $lesson3 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 3,
    ]);

    $lesson1 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    $lesson2 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
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

it('requires authentication', function () {
    $course = Course::factory()->create();

    $response = $this->getJson(
        "/api/v1/courses/{$course->id}/curriculum"
    );

    $response->assertUnauthorized();
});

it('returns 404 for an unknown course', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $response = $this->getJson(
        '/api/v1/courses/00000000-0000-0000-0000-000000000000/curriculum'
    );

    $response->assertNotFound();
});