<?php

use App\Domains\Courses\Exceptions\InvalidSectionPosition;
use App\Domains\Courses\Exceptions\SectionCannotBePublished;
use App\Domains\Courses\Services\SectionService;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);


beforeEach(function () {
    $this->service = app(
        SectionService::class
    );
});


it('accepts a valid draft section', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
        'status' => SectionStatus::DRAFT,
    ]);

    expect(
        fn () => $this->service->validate($section)
    )->not->toThrow(Throwable::class);
});


it('rejects position zero', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->make([
        'course_id' => $course->id,
        'position' => 0,
        'status' => SectionStatus::DRAFT,
    ]);

    expect(
        fn () => $this->service->validate($section)
    )->toThrow(
        InvalidSectionPosition::class
    );
});


it('rejects a negative position', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->make([
        'course_id' => $course->id,
        'position' => -1,
        'status' => SectionStatus::DRAFT,
    ]);

    expect(
        fn () => $this->service->validate($section)
    )->toThrow(
        InvalidSectionPosition::class
    );
});


it('accepts a valid published section', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->make([
        'course_id' => $course->id,
        'title' => 'Introduction',
        'slug' => 'introduction',
        'position' => 1,
        'status' => SectionStatus::PUBLISHED,
    ]);

    expect(
        fn () => $this->service->validate($section)
    )->not->toThrow(Throwable::class);
});


it('rejects publishing a section without a title', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->make([
        'course_id' => $course->id,
        'title' => null,
        'slug' => 'introduction',
        'position' => 1,
        'status' => SectionStatus::PUBLISHED,
    ]);

    expect(
        fn () => $this->service->validate($section)
    )->toThrow(
        SectionCannotBePublished::class
    );
});


it('rejects publishing a section without a slug', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->make([
        'course_id' => $course->id,
        'title' => 'Introduction',
        'slug' => null,
        'position' => 1,
        'status' => SectionStatus::PUBLISHED,
    ]);

    expect(
        fn () => $this->service->validate($section)
    )->toThrow(
        SectionCannotBePublished::class
    );
});


it('rejects publishing a section with an invalid position', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->make([
        'course_id' => $course->id,
        'title' => 'Introduction',
        'slug' => 'introduction',
        'position' => 0,
        'status' => SectionStatus::PUBLISHED,
    ]);

    expect(
        fn () => $this->service->validate($section)
    )->toThrow(
        InvalidSectionPosition::class
    );
});