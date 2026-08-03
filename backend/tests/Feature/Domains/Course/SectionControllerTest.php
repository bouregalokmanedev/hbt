<?php

use App\Domains\Courses\Actions\CreateSectionAction;
use App\Domains\Courses\Actions\DeleteSectionAction;
use App\Domains\Courses\Actions\PublishSectionAction;
use App\Domains\Courses\Actions\ReorderSectionAction;
use App\Domains\Courses\Actions\UnpublishSectionAction;
use App\Domains\Courses\Actions\UpdateSectionAction;
use App\Domains\Courses\Services\SectionService;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);


beforeEach(function () {
    $this->service = app(
        SectionService::class
    );
});

it('creates a section', function () {

    $user = User::factory()->create();

    $course = Course::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/v1/sections', [
            'course_id' => $course->id,
            'title' => 'Introduction',
            'slug' => 'introduction',
            'position' => 1,
        ]);

    $response
        ->assertCreated()
        ->assertJsonPath(
            'title',
            'Introduction'
        );

    $this->assertDatabaseHas('sections', [
        'course_id' => $course->id,
        'slug' => 'introduction',
        'position' => 1,
    ]);
});
it('updates a section', function () {

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'title' => 'Old title',
    ]);

   $response = $this
    ->actingAs($user)
    ->patchJson(
        "/api/v1/sections/{$section->id}",
        [
            'title' => 'New title',
        ]
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'title',
            'New title'
        );
});
it('publishes a section', function () {

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'title' => 'Introduction',
        'slug' => 'introduction',
        'position' => 1,
        'status' => SectionStatus::DRAFT,
    ]);

    $response = $this
        ->actingAs($user)
        ->postJson(
            "/api/v1/sections/{$section->id}/publish"
        );

    $response
        ->assertOk()
        ->assertJsonPath(
            'status',
            SectionStatus::PUBLISHED
        );
});
it('unpublishes a section', function () {

  $user = User::factory()->create();

$course = Course::factory()->create([
    'instructor_id' => $user->id,
]);

$section = Section::factory()->create([
    'course_id' => $course->id,
    'title' => 'Introduction',
    'slug' => 'introduction',
    'position' => 1,
    'status' => SectionStatus::PUBLISHED,
]);

    $response = $this
    ->actingAs($user)
    ->postJson(
        "/api/v1/sections/{$section->id}/unpublish"
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'status',
            SectionStatus::DRAFT
        );
});
it('reorders a section', function () {

$user = User::factory()->create();

$course = Course::factory()->create([
    'instructor_id' => $user->id,
]);

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

    $response = $this
        ->actingAs($user)
        ->postJson(
            "/api/v1/sections/{$third->id}/reorder",
            [
                'position' => 1,
            ]
        );

    $response
        ->assertOk()
        ->assertJsonPath(
            'position',
            1
        );

    expect($first->fresh()->position)
        ->toBe(2);
});
it('rejects a guest from creating a section', function () {

    $course = Course::factory()->create();

   $this
    ->postJson('/api/v1/sections', [
        'course_id' => $course->id,
        'title' => 'Introduction',
        'slug' => 'introduction',
        'position' => 1,
    ])
    ->assertUnauthorized();
});
it('rejects an unauthorized user from updating a section', function () {

    $user = User::factory()->create();

    $section = Section::factory()->create([
        'title' => 'Original',
    ]);
$response = $this
    ->actingAs($user)
    ->patchJson(
        "/api/v1/sections/{$section->id}",
        [
            'title' => 'Hacked',
        ]
    )
    ->assertForbidden();

    expect($section->fresh()->title)
        ->toBe('Original');
});
it('returns 404 for an unknown section', function () {

    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson(
            '/api/sections/00000000-0000-0000-0000-000000000000',
            [
                'title' => 'New title',
            ]
        )
        ->assertNotFound();
});