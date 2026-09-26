<?php

use App\Domains\Notifications\Models\AdminBroadcast;
use App\Domains\Notifications\Models\StudentNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function badgeStudent(array $attributes = []): User
{
    return User::factory()->create($attributes);
}

function makeNotification(User $user, array $attributes = []): StudentNotification
{
    return StudentNotification::query()->create(array_merge([
        'user_id' => $user->id,
        'type' => 'info',
        'title' => 'Badge probe',
        'message' => 'Probe message',
        'action_url' => null,
    ], $attributes));
}

it('returns unread counts grouped by sidebar category', function () {
    $student = badgeStudent();
    $other = badgeStudent();

    $broadcast = AdminBroadcast::query()->create([
        'admin_id' => $student->id,
        'audience' => 'students',
        'type' => 'announcement',
        'title' => 'Probe broadcast',
        'message' => 'Probe broadcast message',
    ]);
    $conversationId = (string) Str::uuid();
    DB::table('message_conversations')->insert([
        'id' => $conversationId,
        'created_by' => $student->id,
        'type' => 'direct',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    makeNotification($student, ['action_url' => '/messages']);
    makeNotification($student, ['message_conversation_id' => $conversationId, 'action_url' => '/dashboard']);
    makeNotification($student, ['type' => 'announcement']);
    makeNotification($student, ['admin_broadcast_id' => $broadcast->id]);
    makeNotification($student, ['action_url' => '/my-courses/42']);
    makeNotification($student, ['action_url' => '/support/tickets/7']);
    makeNotification($student, ['action_url' => '/diagnostics/abc']);
    makeNotification($student, []);
    makeNotification($student, ['action_url' => '/messages', 'read_at' => now()]);
    makeNotification($other, ['action_url' => '/messages']);

    // messages/announcements badges come from conversation read state, not
    // notification rows: one genuinely unread direct message for $student.
    $thread = app(\App\Domains\Messaging\Services\MessagingService::class)->create($other, $student, 'Direct line');
    app(\App\Domains\Messaging\Services\MessagingService::class)->send($other, $thread, 'Real unread message');

    $badges = $this->actingAs($student)
        ->getJson('/api/v1/notifications/sidebar-badges')
        ->assertOk()
        ->json('data');

    expect($badges)->toMatchArray([
        'dashboard' => 1,
        'my-courses' => 1,
        'catalog' => 0,
        'assessments' => 0,
        'diagnostics' => 1,
        'achievements' => 0,
        'certificates' => 0,
        'simulator' => 0,
        'ai-mentor' => 0,
        'messages' => 1,
        'support' => 1,
        'announcements' => 0,
        'favourite' => 0,
        'subscription' => 0,
    ]);
});

it('marks a single category read without touching other categories or users', function () {
    $student = badgeStudent();
    $other = badgeStudent();

    makeNotification($student, ['action_url' => '/messages']);
    makeNotification($student, ['action_url' => '/support']);
    makeNotification($other, ['action_url' => '/messages']);

    $this->actingAs($student)
        ->patchJson('/api/v1/notifications/category/messages/read')
        ->assertOk()
        ->assertJsonPath('data.success', true)
        ->assertJsonPath('data.marked', 1);

    expect(StudentNotification::query()->where('user_id', $student->id)->whereNull('read_at')->count())->toBe(1)
        ->and(StudentNotification::query()->where('user_id', $other->id)->whereNull('read_at')->count())->toBe(1);
});

it('rejects unknown badge categories', function () {
    $student = badgeStudent();

    $this->actingAs($student)
        ->patchJson('/api/v1/notifications/category/nope/read')
        ->assertStatus(422);
});

it('requires authentication for badge endpoints', function () {
    $this->getJson('/api/v1/notifications/sidebar-badges')->assertUnauthorized();
    $this->patchJson('/api/v1/notifications/category/messages/read')->assertUnauthorized();
});
