<?php

use App\Domains\Courses\Actions\CreateSectionAction;
use App\Domains\Courses\Actions\DeleteSectionAction;
use App\Domains\Courses\Actions\PublishSectionAction;
use App\Domains\Courses\Actions\ReorderSectionAction;
use App\Domains\Courses\Actions\UnpublishSectionAction;
use App\Domains\Courses\Actions\UpdateSectionAction;
use App\Domains\Courses\Events\SectionCreated;
use App\Domains\Courses\Events\SectionDeleted;
use App\Domains\Courses\Events\SectionPublished;
use App\Domains\Courses\Events\SectionReordered;
use App\Domains\Courses\Events\SectionUnpublished;
use App\Domains\Courses\Events\SectionUpdated;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use App\Domains\Courses\Exceptions\InvalidSectionPosition;

uses(RefreshDatabase::class);


it('dispatches SectionCreated when a section is created', function () {

    Event::fake([
        SectionCreated::class,
    ]);

    $course = Course::factory()->create();

    $section = app(CreateSectionAction::class)
        ->execute([
            'course_id' => $course->id,
            'title' => 'Introduction',
            'slug' => 'introduction',
            'position' => 1,
            'status' => SectionStatus::DRAFT,
        ]);

    Event::assertDispatched(
        SectionCreated::class,
        fn (SectionCreated $event) =>
            $event->section->is($section)
    );
});


it('dispatches SectionUpdated when a section is updated', function () {

    Event::fake([
        SectionUpdated::class,
    ]);

    $section = Section::factory()->create([
        'title' => 'Old title',
    ]);

    $updated = app(UpdateSectionAction::class)
        ->execute($section, [
            'title' => 'New title',
        ]);

    Event::assertDispatched(
        SectionUpdated::class,
        fn (SectionUpdated $event) =>
            $event->section->is($updated)
    );
});


it('dispatches SectionPublished when published', function () {

    Event::fake([
        SectionPublished::class,
    ]);

    $section = Section::factory()->create([
        'title' => 'Introduction',
        'slug' => 'introduction',
        'position' => 1,
        'status' => SectionStatus::DRAFT,
    ]);

    app(PublishSectionAction::class)
        ->execute($section);

    Event::assertDispatched(
        SectionPublished::class
    );
});


it('dispatches SectionUnpublished when unpublished', function () {

    Event::fake([
        SectionUnpublished::class,
    ]);

    $section = Section::factory()->create([
        'title' => 'Introduction',
        'slug' => 'introduction',
        'position' => 1,
        'status' => SectionStatus::PUBLISHED,
    ]);

    app(UnpublishSectionAction::class)
        ->execute($section);

    Event::assertDispatched(
        SectionUnpublished::class
    );
});


it('dispatches SectionDeleted when deleted', function () {

    Event::fake([
        SectionDeleted::class,
    ]);

    $section = Section::factory()->create();

    $id = $section->id;
    $courseId = $section->course_id;

    app(DeleteSectionAction::class)
        ->execute($section);

    Event::assertDispatched(
        SectionDeleted::class,
        fn (SectionDeleted $event) =>
            $event->sectionId === $id
            && $event->courseId === $courseId
    );
});


it('dispatches SectionReordered when reordered', function () {

    Event::fake([
        SectionReordered::class,
    ]);

    $course = Course::factory()->create();

    $first = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    Section::factory()->create([
        'course_id' => $course->id,
        'position' => 2,
    ]);

    $third = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 3,
    ]);

    app(ReorderSectionAction::class)
        ->execute($third, 1);

    Event::assertDispatched(
        SectionReordered::class,
        fn (SectionReordered $event) =>
            $event->oldPosition === 3
            && $event->newPosition === 1
    );
});
it('does not dispatch SectionCreated when creation rolls back', function () {

    Event::fake([
        SectionCreated::class,
    ]);

    $course = Course::factory()->create();

   expect(fn () =>
    app(CreateSectionAction::class)
        ->execute([
            'course_id' => $course->id,
            'title' => 'Invalid',
            'slug' => 'invalid',
            'position' => 0,
            'status' => SectionStatus::DRAFT,
        ])
)->toThrow(InvalidSectionPosition::class);

    Event::assertNotDispatched(
        SectionCreated::class
    );
});