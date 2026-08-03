<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('belongs to a course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    expect($section->course->is($course))
        ->toBeTrue();
});

it('retrieves lessons belonging to a section', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    $lesson1 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    $lesson2 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
    ]);

    expect($section->lessons)
        ->toHaveCount(2)
        ->and($section->lessons->first()->is($lesson1))
        ->toBeTrue()
        ->and($section->lessons->last()->is($lesson2))
        ->toBeTrue();
});

it('orders section lessons by position', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
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

    $positions = $section
        ->lessons
        ->pluck('position')
        ->all();

    expect($positions)
        ->toBe([1, 2, 3]);
});

it('does not include lessons from another section', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section1 = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    $section2 = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 2,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section2->id,
        'position' => 1,
    ]);

    expect($section1->lessons)
        ->toHaveCount(0);
});

it('retrieves sections with their lessons through a course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section1 = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    $section2 = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 2,
    ]);

    Lesson::factory()->create([
        'section_id' => $section1->id,
        'position' => 1,
    ]);

    Lesson::factory()->create([
        'section_id' => $section2->id,
        'position' => 1,
    ]);

    $course->load('sections.lessons');

    expect($course->sections)
        ->toHaveCount(2)
        ->and($course->sections->first()->lessons)
        ->toHaveCount(1)
        ->and($course->sections->last()->lessons)
        ->toHaveCount(1);
});