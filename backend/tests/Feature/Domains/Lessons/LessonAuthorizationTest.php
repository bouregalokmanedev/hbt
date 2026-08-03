<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows the course instructor to update a lesson', function () {
    $instructor = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
    ]);

    expect(
        $instructor->can('update', $lesson)
    )->toBeTrue();
});

it('rejects another user from updating a lesson', function () {
    $instructor = User::factory()->create();
    $otherUser = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
    ]);

    expect(
        $otherUser->can('update', $lesson)
    )->toBeFalse();
});

it('allows the course instructor to delete a lesson', function () {
    $instructor = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
    ]);

    expect(
        $instructor->can('delete', $lesson)
    )->toBeTrue();
});

it('rejects another user from deleting a lesson', function () {
    $instructor = User::factory()->create();
    $otherUser = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
    ]);

    expect(
        $otherUser->can('delete', $lesson)
    )->toBeFalse();
});

it('allows the course instructor to publish a lesson', function () {
    $instructor = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
    ]);

    expect(
        $instructor->can('publish', $lesson)
    )->toBeTrue();
});

it('rejects another user from publishing a lesson', function () {
    $instructor = User::factory()->create();
    $otherUser = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
    ]);

    expect(
        $otherUser->can('publish', $lesson)
    )->toBeFalse();
});