<?php

use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);


it('belongs to a course', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    expect(
        $section->course->is($course)
    )->toBeTrue();
});


it('can be retrieved from its course', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    expect(
        $course->sections
            ->first()
            ->is($section)
    )->toBeTrue();
});


it('orders sections by position', function () {

    $course = Course::factory()->create();

    $third = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 3,
    ]);

    $first = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    $second = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 2,
    ]);

    $sections = $course->fresh()->sections;

    expect($sections->pluck('id')->all())
        ->toBe([
            $first->id,
            $second->id,
            $third->id,
        ]);
});


it('defaults to draft status', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    expect(
        $section->status
    )->toBe(SectionStatus::DRAFT);
});


it('can create a published section', function () {

    $course = Course::factory()->create();

    $section = Section::factory()
        ->published()
        ->create([
            'course_id' => $course->id,
        ]);

    expect(
        $section->status
    )->toBe(SectionStatus::PUBLISHED);
});
it('does not allow duplicate section positions within the same course', function () {

    $course = Course::factory()->create();

    Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    expect(function () use ($course) {
        Section::factory()->create([
            'course_id' => $course->id,
            'position' => 1,
        ]);
    })->toThrow(\Illuminate\Database\QueryException::class);
});
it('allows the same section position in different courses', function () {

    $courseA = Course::factory()->create();
    $courseB = Course::factory()->create();

    $sectionA = Section::factory()->create([
        'course_id' => $courseA->id,
        'position' => 1,
    ]);

    $sectionB = Section::factory()->create([
        'course_id' => $courseB->id,
        'position' => 1,
    ]);

    expect($sectionA->position)
        ->toBe($sectionB->position);

    expect($sectionA->course_id)
        ->not->toBe($sectionB->course_id);
});