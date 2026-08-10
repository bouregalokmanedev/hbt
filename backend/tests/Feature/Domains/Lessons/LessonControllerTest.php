<?php

use App\Domains\Lessons\Events\LessonCreated;
use App\Domains\Lessons\Events\LessonDeleted;
use App\Domains\Lessons\Events\LessonPublished;
use App\Domains\Lessons\Events\LessonReordered;
use App\Domains\Lessons\Events\LessonUnpublished;
use App\Domains\Lessons\Events\LessonUpdated;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use App\Enums\LessonStatus;
use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

function lessonOwner(): array
{
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    return [$user, $course, $section];
}

it('returns a published lesson to draft when its content is updated', function () {
    $instructor = User::factory()->create();

    $course = Course::factory()
        ->for($instructor, 'instructor')
        ->create();

    $section = Section::factory()
        ->for($course)
        ->create();

    $lesson = Lesson::factory()
        ->for($section)
        ->create([
            'status' => LessonStatus::PUBLISHED,
            'title' => 'Original',
            'slug' => 'original',
            'content' => 'Original content',
            'position' => 1,
        ]);

    actingAs($instructor)
        ->patchJson(
            "/api/v1/lessons/{$lesson->id}",
            [
                'content' => 'Updated content',
            ]
        )
        ->assertOk()
        ->assertJsonPath(
            'status',
            LessonStatus::DRAFT->value
        );
});

it('creates a lesson', function () {
    [$user, $course, $section] = lessonOwner();

    Event::fake([
        LessonCreated::class,
    ]);

    $response = $this
        ->actingAs($user)
        ->postJson('/api/v1/lessons', [
            'section_id' => $section->id,
            'title' => 'Introduction',
            'slug' => 'introduction',
            'description' => 'Introduction lesson',
            'content' => 'Lesson content',
            'position' => 1,
            'status' => 'draft',
        ]);

    $response
        ->assertCreated();

    $this->assertDatabaseHas('lessons', [
        'section_id' => $section->id,
        'slug' => 'introduction',
        'position' => 1,
    ]);

    Event::assertDispatched(
        LessonCreated::class
    );
});

it('updates a lesson', function () {
    [$user, $course, $section] = lessonOwner();

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'title' => 'Old title',
        'position' => 1,
    ]);

    Event::fake([
        LessonUpdated::class,
    ]);

    $response = $this
        ->actingAs($user)
        ->patchJson(
            "/api/v1/lessons/{$lesson->id}",
            [
                'title' => 'New title',
            ]
        );

    $response
        ->assertOk();

    $this->assertDatabaseHas('lessons', [
        'id' => $lesson->id,
        'title' => 'New title',
    ]);

    Event::assertDispatched(
        LessonUpdated::class
    );
});

it('deletes a lesson', function () {
    [$user, $course, $section] = lessonOwner();

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    Event::fake([
        LessonDeleted::class,
    ]);

    $response = $this
        ->actingAs($user)
        ->deleteJson(
            "/api/v1/lessons/{$lesson->id}"
        );

    $response
        ->assertNoContent();

    $this->assertDatabaseMissing(
        'lessons',
        [
            'id' => $lesson->id,
        ]
    );

    Event::assertDispatched(
        LessonDeleted::class
    );
});

it('publishes a lesson', function () {
    [$user, $course, $section] = lessonOwner();

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'title' => 'Introduction',
        'slug' => 'introduction',
        'content' => 'Lesson content',
        'position' => 1,
        'status' => 'draft',
    ]);

    Event::fake([
        LessonPublished::class,
    ]);

    $response = $this
        ->actingAs($user)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/publish"
        );

    $response
        ->assertOk();

    $this->assertDatabaseHas('lessons', [
        'id' => $lesson->id,
        'status' => 'published',
    ]);

    Event::assertDispatched(
        LessonPublished::class
    );
});

it('unpublishes a lesson', function () {
    [$user, $course, $section] = lessonOwner();

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'title' => 'Introduction',
        'slug' => 'introduction',
        'content' => 'Lesson content',
        'position' => 1,
        'status' => 'published',
    ]);

    Event::fake([
        LessonUnpublished::class,
    ]);

    $response = $this
        ->actingAs($user)
        ->postJson(
            "/api/v1/lessons/{$lesson->id}/unpublish"
        );

    $response
        ->assertOk();

    $this->assertDatabaseHas('lessons', [
        'id' => $lesson->id,
        'status' => 'draft',
    ]);

    Event::assertDispatched(
        LessonUnpublished::class
    );
});

it('reorders a lesson', function () {
    [$user, $course, $section] = lessonOwner();

    $lesson1 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    $lesson2 = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 2,
    ]);

    Event::fake([
        LessonReordered::class,
    ]);

    $response = $this
        ->actingAs($user)
        ->postJson(
            "/api/v1/lessons/{$lesson2->id}/reorder",
            [
                'position' => 1,
            ]
        );

    $response
        ->assertOk();

    expect($lesson2->fresh()->position)
        ->toBe(1);

    expect($lesson1->fresh()->position)
        ->toBe(2);

    Event::assertDispatched(
        LessonReordered::class
    );
});

it('rejects an unauthenticated lesson creation', function () {
    [$user, $course, $section] = lessonOwner();

    $response = $this->postJson(
        '/api/v1/lessons',
        [
            'section_id' => $section->id,
            'position' => 1,
        ]
    );

    $response->assertUnauthorized();
});

it('rejects another user from updating a lesson', function () {
    [$owner, $course, $section] = lessonOwner();

    $otherUser = User::factory()->create();

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'position' => 1,
    ]);

    $response = $this
        ->actingAs($otherUser)
        ->patchJson(
            "/api/v1/lessons/{$lesson->id}",
            [
                'title' => 'Unauthorized',
            ]
        );

    $response->assertForbidden();
});