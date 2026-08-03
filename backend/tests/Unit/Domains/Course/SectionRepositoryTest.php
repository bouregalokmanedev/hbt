<?php

use App\Domains\Courses\Repositories\SectionRepositoryInterface;
use App\Models\Course;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);


beforeEach(function () {
    $this->repository = app(
        SectionRepositoryInterface::class
    );
});


it('can create a section', function () {

    $course = Course::factory()->create();

    $section = $this->repository->create([
        'course_id' => $course->id,
        'title' => 'Introduction',
        'slug' => 'introduction',
        'description' => 'Course introduction',
        'position' => 1,
        'status' => 'draft',
    ]);

    expect($section)
        ->toBeInstanceOf(Section::class);

    $this->assertDatabaseHas(
        'sections',
        [
            'id' => $section->id,
            'course_id' => $course->id,
            'position' => 1,
        ]
    );
});


it('can find a section', function () {

    $section = Section::factory()->create();

    $result = $this->repository->find(
        $section->id
    );

    expect($result?->is($section))
        ->toBeTrue();
});


it('returns null when a section does not exist', function () {

    $result = $this->repository->find(
        fake()->uuid()
    );

    expect($result)
        ->toBeNull();
});


it('can find a section or fail', function () {

    $section = Section::factory()->create();

    $result = $this->repository->findOrFail(
        $section->id
    );

    expect($result->is($section))
        ->toBeTrue();
});


it('returns sections for a course in position order', function () {

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

    $sections = $this->repository
        ->findByCourse($course->id);

    expect($sections->pluck('id')->all())
        ->toBe([
            $first->id,
            $second->id,
            $third->id,
        ]);
});


it('can find a section by course and position', function () {

    $course = Course::factory()->create();

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 2,
    ]);

    $result = $this->repository
        ->findByCourseAndPosition(
            $course->id,
            2
        );

    expect($result?->is($section))
        ->toBeTrue();
});


it('returns null when the position does not exist', function () {

    $course = Course::factory()->create();

    Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    $result = $this->repository
        ->findByCourseAndPosition(
            $course->id,
            99
        );

    expect($result)
        ->toBeNull();
});


it('can update a section', function () {

    $section = Section::factory()->create([
        'title' => 'Old Title',
    ]);

    $updated = $this->repository->update(
        $section,
        [
            'title' => 'New Title',
        ]
    );

    expect($updated->title)
        ->toBe('New Title');

    $this->assertDatabaseHas(
        'sections',
        [
            'id' => $section->id,
            'title' => 'New Title',
        ]
    );
});


it('can delete a section', function () {

    $section = Section::factory()->create();

    $this->repository->delete($section);

    $this->assertDatabaseMissing(
        'sections',
        [
            'id' => $section->id,
        ]
    );
});