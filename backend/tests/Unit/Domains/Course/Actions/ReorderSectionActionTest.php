<?php

use App\Domains\Courses\Actions\ReorderSectionAction;
use App\Models\Course;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);


function createOrderedSections(Course $course): array
{
    return [
        Section::factory()->create([
            'course_id' => $course->id,
            'title' => 'Introduction',
            'position' => 1,
        ]),

        Section::factory()->create([
            'course_id' => $course->id,
            'title' => 'PHP',
            'position' => 2,
        ]),

        Section::factory()->create([
            'course_id' => $course->id,
            'title' => 'Laravel',
            'position' => 3,
        ]),
    ];
}


it('moves a section upward', function () {

    $course = Course::factory()->create();

    [$introduction, $php, $laravel] =
        createOrderedSections($course);

    $result = app(ReorderSectionAction::class)
        ->execute($laravel, 1);

    expect($result->position)
        ->toBe(1);

    expect($introduction->fresh()->position)
        ->toBe(2);

    expect($php->fresh()->position)
        ->toBe(3);
});


it('moves a section downward', function () {

    $course = Course::factory()->create();

    [$introduction, $php, $laravel] =
        createOrderedSections($course);

    $result = app(ReorderSectionAction::class)
        ->execute($introduction, 3);

    expect($result->position)
        ->toBe(3);

    expect($php->fresh()->position)
        ->toBe(1);

    expect($laravel->fresh()->position)
        ->toBe(2);
});


it('keeps positions unchanged when moving to the same position', function () {

    $course = Course::factory()->create();

    [$introduction, $php, $laravel] =
        createOrderedSections($course);

    $result = app(ReorderSectionAction::class)
        ->execute($php, 2);

    expect($result->position)
        ->toBe(2);

    expect($introduction->fresh()->position)
        ->toBe(1);

    expect($laravel->fresh()->position)
        ->toBe(3);
});


it('rejects position zero', function () {

    $course = Course::factory()->create();

    [, , $laravel] =
        createOrderedSections($course);

    expect(fn () =>
        app(ReorderSectionAction::class)
            ->execute($laravel, 0)
    )->toThrow(
        InvalidArgumentException::class
    );
});


it('rejects a position beyond the number of sections', function () {

    $course = Course::factory()->create();

    [, , $laravel] =
        createOrderedSections($course);

    expect(fn () =>
        app(ReorderSectionAction::class)
            ->execute($laravel, 4)
    )->toThrow(
        InvalidArgumentException::class
    );
});


it('does not affect another course', function () {

    $courseA = Course::factory()->create();

    [$introduction, $php, $laravel] =
        createOrderedSections($courseA);

    $courseB = Course::factory()->create();

    $other = Section::factory()->create([
        'course_id' => $courseB->id,
        'position' => 1,
    ]);

    app(ReorderSectionAction::class)
        ->execute($laravel, 1);

    expect($other->fresh()->position)
        ->toBe(1);

    expect($introduction->fresh()->position)
        ->toBe(2);

    expect($php->fresh()->position)
        ->toBe(3);
});


it('preserves contiguous positions after reordering', function () {

    $course = Course::factory()->create();

    [$introduction, $php, $laravel] =
        createOrderedSections($course);

    app(ReorderSectionAction::class)
        ->execute($laravel, 1);

    $positions = $course
        ->fresh()
        ->sections
        ->pluck('position')
        ->all();

    expect($positions)
        ->toBe([1, 2, 3]);
});