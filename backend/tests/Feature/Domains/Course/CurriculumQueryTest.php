<?php

use App\Domains\Courses\Queries\CurriculumQuery;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('loads a complete course curriculum', function () {
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

    $lesson1 = Lesson::factory()->create([
        'section_id' => $section1->id,
        'position' => 1,
    ]);

    $lesson2 = Lesson::factory()->create([
        'section_id' => $section1->id,
        'position' => 2,
    ]);

    $lesson3 = Lesson::factory()->create([
        'section_id' => $section2->id,
        'position' => 1,
    ]);

    $curriculum = app(CurriculumQuery::class)
        ->getForCourse($course);

    expect($curriculum->sections)
        ->toHaveCount(2);

    expect($curriculum->sections->first()->is($section1))
        ->toBeTrue();

    expect($curriculum->sections->last()->is($section2))
        ->toBeTrue();

    expect($curriculum->sections->first()->lessons)
        ->toHaveCount(2);

    expect(
        $curriculum
            ->sections
            ->first()
            ->lessons
            ->first()
            ->is($lesson1)
    )->toBeTrue();

    expect(
        $curriculum
            ->sections
            ->first()
            ->lessons
            ->last()
            ->is($lesson2)
    )->toBeTrue();

    expect(
        $curriculum
            ->sections
            ->last()
            ->lessons
            ->first()
            ->is($lesson3)
    )->toBeTrue();
});

it('does not include sections from another course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $otherCourse = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    Section::factory()->create([
        'course_id' => $otherCourse->id,
        'position' => 1,
    ]);

    $curriculum = app(CurriculumQuery::class)
        ->getForCourse($course);

    expect($curriculum->sections)
        ->toHaveCount(1);

    expect($curriculum->sections->first()->course_id)
        ->toBe($course->id);
});

it('returns sections and lessons in position order', function () {
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

    Lesson::factory()->create([
        'section_id' => $section1->id,
        'position' => 3,
    ]);

    Lesson::factory()->create([
        'section_id' => $section1->id,
        'position' => 1,
    ]);

    Lesson::factory()->create([
        'section_id' => $section1->id,
        'position' => 2,
    ]);

    $curriculum = app(CurriculumQuery::class)
        ->getForCourse($course);

    expect(
        $curriculum
            ->sections
            ->pluck('position')
            ->all()
    )->toBe([1, 2]);

    expect(
        $curriculum
            ->sections
            ->first()
            ->lessons
            ->pluck('position')
            ->all()
    )->toBe([1, 2, 3]);
});