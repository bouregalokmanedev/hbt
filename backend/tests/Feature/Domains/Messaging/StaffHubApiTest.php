<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function staffHubUser(string $role): User
{
    Role::findOrCreate($role, 'web');
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

/**
 * @return array<string, User>
 */
function staffHubAudience(): array
{
    return [
        'admin' => staffHubUser('Admin'),
        'super' => staffHubUser('Super Admin'),
        'support' => staffHubUser('Support'),
        'instructor' => staffHubUser('Instructor'),
        'student' => staffHubUser('Student'),
    ];
}

it('lets support publish news to every staff role without reaching students', function () {
    $people = staffHubAudience();

    $broadcast = $this->actingAs($people['support'])
        ->postJson('/api/v1/staff-hub/news', [
            'title' => 'Desk maintenance',
            'message' => 'The support desk reopens at 09:00.',
        ])
        ->assertOk()
        ->assertJsonPath('data.audience', 'staff')
        ->assertJsonPath('data.delivery.recipients', 4)
        ->assertJsonPath('data.delivery.delivered', 4)
        ->assertJsonPath('data.delivery.failed', 0)
        ->json('data');

    foreach (['admin', 'super', 'support', 'instructor'] as $key) {
        $this->assertDatabaseHas('student_notifications', [
            'user_id' => $people[$key]->id,
            'admin_broadcast_id' => $broadcast['id'],
        ]);
    }

    $this->assertDatabaseMissing('student_notifications', [
        'user_id' => $people['student']->id,
        'admin_broadcast_id' => $broadcast['id'],
    ]);
});

it('lets an instructor publish staff news', function () {
    $people = staffHubAudience();

    $this->actingAs($people['instructor'])
        ->postJson('/api/v1/staff-hub/news', [
            'title' => 'New lab template',
            'message' => 'The EV lab template is ready for review.',
        ])
        ->assertOk()
        ->assertJsonPath('data.audience', 'staff')
        ->assertJsonPath('data.delivery.recipients', 4)
        ->assertJsonPath('data.delivery.delivered', 4);
});

it('ignores an audience override so staff news can never reach students', function () {
    $people = staffHubAudience();

    $broadcast = $this->actingAs($people['admin'])
        ->postJson('/api/v1/staff-hub/news', [
            'audience' => 'students',
            'title' => 'Sneaky',
            'message' => 'Should not land on students.',
        ])
        ->assertOk()
        ->assertJsonPath('data.audience', 'staff')
        ->json('data');

    $this->assertDatabaseMissing('student_notifications', [
        'user_id' => $people['student']->id,
        'admin_broadcast_id' => $broadcast['id'],
    ]);
});

it('forbids students from publishing staff news', function () {
    $people = staffHubAudience();

    $this->actingAs($people['student'])
        ->postJson('/api/v1/staff-hub/news', [
            'title' => 'Attempt',
            'message' => 'Attempt',
        ])
        ->assertForbidden();
});

it('requires a title and a message', function () {
    $people = staffHubAudience();

    $this->actingAs($people['support'])
        ->postJson('/api/v1/staff-hub/news', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['title', 'message']);
});

it('creates the staff room once and hands the same room back on every visit', function () {
    $people = staffHubAudience();

    $first = $this->actingAs($people['support'])
        ->getJson('/api/v1/staff-hub/room')
        ->assertOk()
        ->json('data');

    $second = $this->actingAs($people['instructor'])
        ->getJson('/api/v1/staff-hub/room')
        ->assertOk()
        ->json('data');

    expect($first['id'])->toBe($second['id']);
    expect($first['type'])->toBe('staff_room');
    expect($first['status'])->toBe('active');
    expect(
        \App\Domains\Messaging\Models\MessageConversation::query()->where('type', 'staff_room')->count()
    )->toBe(1);
});

it('keeps every staff role in the room and students out of it', function () {
    $people = staffHubAudience();

    $room = $this->actingAs($people['admin'])
        ->getJson('/api/v1/staff-hub/room')
        ->assertOk()
        ->json('data');

    $participantIds = collect($room['participants'])->pluck('id');
    expect($participantIds)->toContain(
        $people['admin']->uuid,
        $people['super']->uuid,
        $people['support']->uuid,
        $people['instructor']->uuid,
    );
    expect($participantIds)->not->toContain($people['student']->uuid);
    expect($room['member_count'])->toBe(4);
});

it('shows the staff room in the conversation list', function () {
    $people = staffHubAudience();

    $room = $this->actingAs($people['support'])
        ->getJson('/api/v1/staff-hub/room')
        ->assertOk()
        ->json('data');

    $list = $this->actingAs($people['support'])
        ->getJson('/api/v1/messages/conversations')
        ->assertOk()
        ->json('data');

    $listed = collect($list)->firstWhere('id', $room['id']);
    expect($listed)->not->toBeNull();
    expect($listed['type'])->toBe('staff_room');
});

it('syncs membership when someone joins or leaves the staff', function () {
    $people = staffHubAudience();

    $room = $this->actingAs($people['admin'])
        ->getJson('/api/v1/staff-hub/room')
        ->assertOk()
        ->json('data');

    $this->assertDatabaseMissing('message_participants', [
        'conversation_id' => $room['id'],
        'user_id' => $people['student']->id,
    ]);

    // A learner graduates into an instructor role.
    $people['student']->removeRole('Student');
    $people['student']->assignRole('Support');
    $this->actingAs($people['admin'])->getJson('/api/v1/staff-hub/room')->assertOk();
    $this->assertDatabaseHas('message_participants', [
        'conversation_id' => $room['id'],
        'user_id' => $people['student']->id,
    ]);

    // …and then leaves the staff entirely.
    $people['student']->removeRole('Support');
    $this->actingAs($people['admin'])->getJson('/api/v1/staff-hub/room')->assertOk();
    $this->assertDatabaseMissing('message_participants', [
        'conversation_id' => $room['id'],
        'user_id' => $people['student']->id,
    ]);
});

it('forbids students from opening the staff room', function () {
    $people = staffHubAudience();

    $this->actingAs($people['student'])
        ->getJson('/api/v1/staff-hub/room')
        ->assertForbidden();
});

it('refuses the staff room to a non-staff user at the service layer', function () {
    $student = staffHubUser('Student');

    expect(fn () => app(\App\Domains\Messaging\Services\MessagingService::class)->staffRoomFor($student))
        ->toThrow(\Symfony\Component\HttpKernel\Exception\HttpException::class);
});

it('keeps the staff room unreadable by someone who is not a member', function () {
    $people = staffHubAudience();

    $room = $this->actingAs($people['admin'])
        ->getJson('/api/v1/staff-hub/room')
        ->assertOk()
        ->json('data');

    // Drop everyone but the admin, then have a Support agent try to read it.
    \App\Domains\Messaging\Models\MessageParticipant::query()
        ->where('conversation_id', $room['id'])
        ->where('user_id', '!=', $people['admin']->id)
        ->delete();

    $this->actingAs($people['support'])
        ->getJson("/api/v1/messages/conversations/{$room['id']}")
        ->assertForbidden();
});
