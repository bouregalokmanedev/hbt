<?php

use App\Domains\AI\Models\MentorConversation;
use App\Models\Course;
use Database\Factories\Domains\AI\Models\MentorConversationFactory;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('requires authentication to access mentor conversations', function () {
    $this->getJson('/api/v1/mentor/conversations')
        ->assertUnauthorized();
});

it('lists the authenticated users mentor conversations', function () {
    $user = User::factory()->create();

    MentorConversation::factory()->create([
        'user_id' => $user->id,
        'title' => 'Engine Diagnostics',
    ]);

    MentorConversation::factory()->create([
        'user_id' => $user->id,
        'title' => 'CAN Bus',
    ]);

    MentorConversation::factory()->create([
        'user_id' => User::factory(),
        'title' => 'Another User Conversation',
    ]);

    $this->actingAs($user)
        ->getJson('/api/v1/mentor/conversations')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment([
            'title' => 'Engine Diagnostics',
        ])
        ->assertJsonFragment([
            'title' => 'CAN Bus',
        ])
        ->assertJsonMissing([
            'title' => 'Another User Conversation',
        ]);
});

it('creates a mentor conversation', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/v1/mentor/conversations', [
            'title' => 'Engine Diagnostics Mentor',
        ])
        ->assertCreated()
        ->assertJsonPath(
            'data.title',
            'Engine Diagnostics Mentor'
        )
        ->assertJsonPath(
            'data.status',
            'active'
        );

    expect(
        MentorConversation::query()
            ->where('user_id', $user->id)
            ->where('title', 'Engine Diagnostics Mentor')
            ->exists()
    )->toBeTrue();
});

it('creates a course mentor conversation for an enrolled course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $this->actingAs($user)
        ->postJson('/api/v1/mentor/conversations', [
            'course_id' => $course->id,
            'title' => 'Course Mentor',
        ])
        ->assertCreated()
        ->assertJsonPath(
            'data.course_id',
            $course->id
        );
});

it('does not allow a conversation for a course the user is not enrolled in', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/v1/mentor/conversations', [
            'course_id' => $course->id,
        ])
        ->assertStatus(422);

    expect(
        MentorConversation::query()
            ->where('user_id', $user->id)
            ->count()
    )->toBe(0);
});

it('shows a conversation belonging to the authenticated user', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
        'title' => 'Engine Mentor',
    ]);

    $this->actingAs($user)
        ->getJson(
            "/api/v1/mentor/conversations/{$conversation->id}"
        )
        ->assertOk()
        ->assertJsonPath(
            'data.id',
            $conversation->id
        )
        ->assertJsonPath(
            'data.title',
            'Engine Mentor'
        );
});

it('does not allow a user to view another users conversation', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $owner->id,
    ]);

    $this->actingAs($otherUser)
        ->getJson(
            "/api/v1/mentor/conversations/{$conversation->id}"
        )
        ->assertForbidden();
});