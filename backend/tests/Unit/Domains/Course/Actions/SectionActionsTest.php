<?php

use App\Domains\Courses\Actions\CreateSectionAction;
use App\Domains\Courses\Actions\DeleteSectionAction;
use App\Domains\Courses\Actions\PublishSectionAction;
use App\Domains\Courses\Actions\UpdateSectionAction;
use App\Domains\Courses\Exceptions\InvalidSectionPosition;
use App\Domains\Courses\Exceptions\SectionCannotBePublished;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Section;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Domains\Courses\Actions\UnpublishSectionAction;

uses(RefreshDatabase::class);


it('creates a section', function () {

    $course = Course::factory()->create();

    $section = app(CreateSectionAction::class)
        ->execute([
            'course_id' => $course->id,
            'title' => 'Introduction',
            'slug' => 'introduction',
            'description' => 'Introduction',
            'position' => 1,
            'status' => SectionStatus::DRAFT,
        ]);

    expect($section)
        ->toBeInstanceOf(Section::class);

    $this->assertDatabaseHas('sections', [
        'id' => $section->id,
        'course_id' => $course->id,
        'position' => 1,
    ]);
});


it('does not persist an invalid section', function () {

    $course = Course::factory()->create();

    expect(fn () =>
        app(CreateSectionAction::class)->execute([
            'course_id' => $course->id,
            'title' => 'Invalid',
            'slug' => 'invalid',
            'position' => 0,
            'status' => SectionStatus::DRAFT,
        ])
    )->toThrow(InvalidSectionPosition::class);

    $this->assertDatabaseMissing('sections', [
        'course_id' => $course->id,
        'position' => 0,
    ]);
});


it('updates a section', function () {

    $section = Section::factory()->create([
        'title' => 'Old title',
    ]);

    $updated = app(UpdateSectionAction::class)
        ->execute(
            $section,
            [
                'title' => 'New title',
            ]
        );

    expect($updated->title)
        ->toBe('New title');
});


it('does not persist an invalid update', function () {

    $section = Section::factory()->create([
        'position' => 1,
    ]);

    expect(fn () =>
        app(UpdateSectionAction::class)->execute(
            $section,
            [
                'position' => 0,
            ]
        )
    )->toThrow(InvalidSectionPosition::class);

    expect(
        $section->fresh()->position
    )->toBe(1);
});


it('publishes a valid section', function () {

    $section = Section::factory()->create([
        'title' => 'Introduction',
        'slug' => 'introduction',
        'position' => 1,
        'status' => SectionStatus::DRAFT,
    ]);

    $published = app(PublishSectionAction::class)
        ->execute($section);

    expect($published->status)
        ->toBe(SectionStatus::PUBLISHED);
});


it('does not publish an invalid section', function () {

    $section = Section::factory()->create([
        'title' => 'Introduction',
        'slug' => 'introduction',
        'position' => 1,
        'status' => SectionStatus::DRAFT,
    ]);

    $section->title = null;

    expect(fn () =>
        app(PublishSectionAction::class)
            ->execute($section)
    )->toThrow(SectionCannotBePublished::class);

    expect(
        $section->fresh()->status
    )->toBe(SectionStatus::DRAFT);
});


it('deletes a section', function () {

    $section = Section::factory()->create();

    app(DeleteSectionAction::class)
        ->execute($section);

    $this->assertDatabaseMissing('sections', [
        'id' => $section->id,
    ]);
});
it('publishes a valid draft section', function () {

    $section = Section::factory()->create([
        'title' => 'Introduction',
        'slug' => 'introduction',
        'position' => 1,
        'status' => SectionStatus::DRAFT,
    ]);

    $result = app(PublishSectionAction::class)
        ->execute($section);

    expect($result->status)
        ->toBe(SectionStatus::PUBLISHED);
});
it('unpublishes a published section', function () {

    $section = Section::factory()
        ->published()
        ->create([
            'title' => 'Introduction',
            'slug' => 'introduction',
            'position' => 1,
        ]);

    $result = app(UnpublishSectionAction::class)
        ->execute($section);

    expect($result->status)
        ->toBe(SectionStatus::DRAFT);
});
it('does not allow update action to change publication status', function () {

    $section = Section::factory()->create([
        'status' => SectionStatus::DRAFT,
    ]);

    expect(fn () =>
        app(UpdateSectionAction::class)
            ->execute(
                $section,
                [
                    'status' => SectionStatus::PUBLISHED,
                ]
            )
    )->toThrow(
        \App\Domains\Courses\Exceptions\SectionStatusCannotBeChanged::class
    );

    expect($section->fresh()->status)
        ->toBe(SectionStatus::DRAFT);
});
it('can publish and then unpublish a section', function () {

    $section = Section::factory()->create([
        'title' => 'Introduction',
        'slug' => 'introduction',
        'position' => 1,
        'status' => SectionStatus::DRAFT,
    ]);

    $publisher = app(PublishSectionAction::class);
    $unpublisher = app(UnpublishSectionAction::class);

    $published = $publisher->execute($section);

    expect($published->status)
        ->toBe(SectionStatus::PUBLISHED);

    $draft = $unpublisher->execute($published);

    expect($draft->status)
        ->toBe(SectionStatus::DRAFT);
});