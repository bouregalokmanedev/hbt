<?php

use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a section through the complete API workflow', function () {

    $user = User::factory()->create();

    $course = Course::factory()->create();

    $response = $this
        ->actingAs($user)
        ->postJson('/api/v1/sections', [
            'course_id' => $course->id,
            'title' => 'Introduction to PHP',
            'slug' => 'introduction-to-php',
            'description' => 'PHP fundamentals',
            'position' => 1,
        ]);

    $response
        ->assertCreated()
        ->assertJsonPath(
            'title',
            'Introduction to PHP'
        )
        ->assertJsonPath(
            'slug',
            'introduction-to-php'
        )
        ->assertJsonPath(
            'position',
            1
        );

    $this->assertDatabaseHas('sections', [
        'course_id' => $course->id,
        'title' => 'Introduction to PHP',
        'slug' => 'introduction-to-php',
        'position' => 1,
        'status' => SectionStatus::DRAFT,
    ]);
});

it('updates a section through the complete API workflow', function () {

  $user = User::factory()->create();

$course = Course::factory()->create([
    'instructor_id' => $user->id,
]);

$section = Section::factory()->create([
    'course_id' => $course->id,
    'title' => 'Old Title',
    'slug' => 'old-title',
    'status' => SectionStatus::DRAFT,
]);
    $response = $this
        ->actingAs($user)
        ->patchJson(
            "/api/v1/sections/{$section->id}",
            [
                'title' => 'New Title',
                'slug' => 'new-title',
            ]
        );

    $response
        ->assertOk()
        ->assertJsonPath(
            'title',
            'New Title'
        )
        ->assertJsonPath(
            'slug',
            'new-title'
        );

    expect($section->fresh())
        ->title
        ->toBe('New Title');
});

it('publishes and unpublishes a section through the API', function () {

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

    $publishResponse = $this
        ->actingAs($user)
        ->postJson(
            "/api/v1/sections/{$section->id}/publish"
        );

    $publishResponse
        ->assertOk()
        ->assertJsonPath(
            'status',
            SectionStatus::PUBLISHED
        );

    expect($section->fresh()->status)
        ->toBe(SectionStatus::PUBLISHED);


    $unpublishResponse = $this
        ->actingAs($user)
        ->postJson(
            "/api/v1/sections/{$section->id}/unpublish"
        );

    $unpublishResponse
        ->assertOk()
        ->assertJsonPath(
            'status',
            SectionStatus::DRAFT
        );

    expect($section->fresh()->status)
        ->toBe(SectionStatus::DRAFT);
});

it('cannot publish an incomplete section', function () {

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'title' => null,
        'slug' => 'introduction',
        'position' => 1,
        'status' => SectionStatus::DRAFT,
    ]);

    $this
        ->actingAs($user)
        ->postJson(
            "/api/v1/sections/{$section->id}/publish"
        )
        ->assertStatus(422);

    expect($section->fresh()->status)
        ->toBe(SectionStatus::DRAFT);
});

it('reorders sections through the complete API workflow', function () {

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $first = Section::factory()->create([
        'course_id' => $course->id,
        'title' => 'Introduction',
        'position' => 1,
    ]);

    $second = Section::factory()->create([
        'course_id' => $course->id,
        'title' => 'PHP',
        'position' => 2,
    ]);

    $third = Section::factory()->create([
        'course_id' => $course->id,
        'title' => 'Laravel',
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

    expect($third->fresh()->position)
        ->toBe(1);

    expect($first->fresh()->position)
        ->toBe(2);

    expect($second->fresh()->position)
        ->toBe(3);
});

it('keeps section ordering isolated to its course', function () {

    $user = User::factory()->create();

   $courseA = Course::factory()->create([
    'instructor_id' => $user->id,
]);

    $a1 = Section::factory()->create([
        'course_id' => $courseA->id,
        'position' => 1,
    ]);

    $a2 = Section::factory()->create([
        'course_id' => $courseA->id,
        'position' => 2,
    ]);

    $courseB = Course::factory()->create([
    'instructor_id' => $user->id,
]);

    $b1 = Section::factory()->create([
        'course_id' => $courseB->id,
        'position' => 1,
    ]);

    $b2 = Section::factory()->create([
        'course_id' => $courseB->id,
        'position' => 2,
    ]);

    $this
        ->actingAs($user)
        ->postJson(
            "/api/v1/sections/{$a2->id}/reorder",
            [
                'position' => 1,
            ]
        )
        ->assertOk();

    expect($a2->fresh()->position)
        ->toBe(1);

    expect($a1->fresh()->position)
        ->toBe(2);

    expect($b1->fresh()->position)
        ->toBe(1);

    expect($b2->fresh()->position)
        ->toBe(2);
});

it('cannot publish a section through the normal update endpoint', function () {

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'status' => SectionStatus::DRAFT,
    ]);

    $this
        ->actingAs($user)
        ->patchJson(
            "/api/v1/sections/{$section->id}",
            [
                'status' => SectionStatus::PUBLISHED,
            ]
        )
        ->assertStatus(422);

    expect($section->fresh()->status)
        ->toBe(SectionStatus::DRAFT);
});

it('cannot change position through the normal update endpoint', function () {

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    $this
        ->actingAs($user)
        ->patchJson(
            "/api/v1/sections/{$section->id}",
            [
                'position' => 3,
            ]
        )
        ->assertStatus(422);

    expect($section->fresh()->position)
        ->toBe(1);
});

it('deletes a section through the complete API workflow', function () {
$user = User::factory()->create();

$course = Course::factory()->create([
    'instructor_id' => $user->id,
]);

$section = Section::factory()->create([
    'course_id' => $course->id,
]);

    $this
        ->actingAs($user)
        ->deleteJson(
            "/api/v1/sections/{$section->id}"
        )
        ->assertNoContent();

    $this->assertDatabaseMissing(
        'sections',
        [
            'id' => $section->id,
        ]
    );
});

it('returns 404 for an unknown section', function () {

    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/sections/00000000-0000-0000-0000-000000000000',
            [
                'title' => 'New title',
            ]
        )
        ->assertNotFound();
});

it('requires authentication for section operations', function () {

    $section = Section::factory()->create();

    $this
        ->patchJson(
            "/api/v1/sections/{$section->id}",
            [
                'title' => 'New title',
            ]
        )
        ->assertUnauthorized();

    $this
        ->postJson(
            "/api/v1/sections/{$section->id}/publish"
        )
        ->assertUnauthorized();

    $this
        ->postJson(
            "/api/v1/sections/{$section->id}/reorder",
            [
                'position' => 1,
            ]
        )
        ->assertUnauthorized();

    $this
        ->deleteJson(
            "/api/v1/sections/{$section->id}"
        )
        ->assertUnauthorized();
});