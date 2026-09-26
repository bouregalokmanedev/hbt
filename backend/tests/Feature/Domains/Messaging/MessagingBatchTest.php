<?php

use App\Domains\Messaging\Services\MessagingService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function batchUsers(int $count = 2): array
{
    return User::factory()->count($count)->create()->all();
}

function batchConversation(User $sender, User $recipient, string $subject = 'Batch thread'): \App\Domains\Messaging\Models\MessageConversation
{
    return app(MessagingService::class)->create($sender, $recipient, $subject);
}

function asAdmin(User $user): User
{
    Role::findOrCreate('Admin', 'web');
    $user->assignRole('Admin');

    return $user;
}

it('tracks unread_count before and after read and mirrors it in sidebar badges', function () {
    [$sender, $recipient] = batchUsers();
    $conversation = batchConversation($sender, $recipient);
    $service = app(MessagingService::class);
    $service->send($sender, $conversation, 'First hello');
    $service->send($sender, $conversation, 'Second hello');

    $view = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($view['unread_count'])->toBe(2);

    // The sender's own messages never count as unread for the sender.
    $senderView = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($senderView['unread_count'])->toBe(0);

    // Conversation list exposes the same count.
    $listed = $this->actingAs($recipient)
        ->getJson('/api/v1/messages/conversations')
        ->assertOk()
        ->json('data');

    expect(collect($listed)->firstWhere('id', $conversation->id)['unread_count'])->toBe(2);

    // Sidebar badges use conversation truth for the messages category.
    $badges = $this->actingAs($recipient)
        ->getJson('/api/v1/notifications/sidebar-badges')
        ->assertOk()
        ->json('data');

    expect($badges['messages'])->toBe(2);

    $this->actingAs($recipient)
        ->patchJson("/api/v1/messages/conversations/{$conversation->id}/read")
        ->assertOk();

    $after = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($after['unread_count'])->toBe(0);

    $badgesAfter = $this->actingAs($recipient)
        ->getJson('/api/v1/notifications/sidebar-badges')
        ->assertOk()
        ->json('data');

    expect($badgesAfter['messages'])->toBe(0);
});

it('excludes for_all-deleted messages from unread counts', function () {
    [$sender, $recipient] = batchUsers();
    $conversation = batchConversation($sender, $recipient);
    $service = app(MessagingService::class);

    $this->actingAs($recipient)
        ->patchJson("/api/v1/messages/conversations/{$conversation->id}/read")
        ->assertOk();

    // Backdate the read marker so the next message is strictly newer
    // (sqlite timestamps only have second precision).
    \App\Domains\Messaging\Models\MessageParticipant::query()
        ->where('conversation_id', $conversation->id)
        ->where('user_id', $recipient->id)
        ->update(['last_read_at' => now()->subMinutes(5)]);

    $message = $service->send($sender, $conversation, 'Oops, wrong thread');

    $unread = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data.unread_count');

    expect($unread)->toBe(1);

    $this->actingAs($sender)
        ->deleteJson("/api/v1/messages/{$message->id}", ['scope' => 'for_all'])
        ->assertOk();

    $unreadAfter = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data.unread_count');

    expect($unreadAfter)->toBe(0);
});

it('rejects reply_to messages from another conversation', function () {
    [$sender, $recipient] = batchUsers();
    $first = batchConversation($sender, $recipient, 'First');
    $second = batchConversation($sender, $recipient, 'Second');
    $service = app(MessagingService::class);
    $foreign = $service->send($sender, $second, 'Lives elsewhere');

    $this->actingAs($sender)
        ->postJson("/api/v1/messages/conversations/{$first->id}/messages", [
            'body' => 'Trying to quote across threads',
            'reply_to' => $foreign->id,
        ])
        ->assertStatus(422);

    $this->actingAs($sender)
        ->postJson("/api/v1/messages/conversations/{$first->id}/messages", [
            'body' => 'Unknown quote',
            'reply_to' => (string) Str::uuid(),
        ])
        ->assertStatus(422);
});

it('stores replies with a preview of the quoted message', function () {
    [$sender, $recipient] = batchUsers();
    $conversation = batchConversation($sender, $recipient);
    $service = app(MessagingService::class);
    $parent = $service->send($sender, $conversation, 'Parent message body here for quoting');

    $reply = $this->actingAs($recipient)
        ->postJson("/api/v1/messages/conversations/{$conversation->id}/messages", [
            'body' => 'Child reply',
            'reply_to' => $parent->id,
        ])
        ->assertCreated()
        ->json('data');

    expect($reply['reply_to'])->toBe($parent->id)
        ->and($reply['reply_preview']['sender_name'])->toBe($sender->full_name)
        ->and($reply['reply_preview']['body_excerpt'])->toContain('Parent message body')
        ->and($reply['reply_preview']['has_attachment'])->toBeFalse();

    $shown = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data.messages');

    $child = collect($shown)->firstWhere('id', $reply['id']);
    expect($child['reply_to'])->toBe($parent->id)
        ->and($child['reply_preview']['sender_name'])->toBe($sender->full_name);
});

it('lets the sender delete for everyone within 15 minutes', function () {
    [$sender, $recipient] = batchUsers();
    $conversation = batchConversation($sender, $recipient);
    $message = app(MessagingService::class)->send($sender, $conversation, 'Secret plans');

    $this->actingAs($sender)
        ->deleteJson("/api/v1/messages/{$message->id}", ['scope' => 'for_all'])
        ->assertOk()
        ->assertJsonPath('data.deleted', 'all')
        ->assertJsonPath('data.body', null)
        ->assertJsonPath('data.attachment', null);

    expect($message->fresh()->body)->toBeNull();

    // Everyone sees the tombstone.
    $shown = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data.messages');

    $tombstone = collect($shown)->firstWhere('id', $message->id);
    expect($tombstone['deleted'])->toBe('all')->and($tombstone['body'])->toBeNull();
});

it('forbids for_all deletes from other users and old messages', function () {
    [$sender, $recipient] = batchUsers();
    $conversation = batchConversation($sender, $recipient);
    $service = app(MessagingService::class);

    $others = $service->send($sender, $conversation, 'Sender only delete');
    $this->actingAs($recipient)
        ->deleteJson("/api/v1/messages/{$others->id}", ['scope' => 'for_all'])
        ->assertForbidden();

    $old = $service->send($sender, $conversation, 'Too old to recall');
    $old->forceFill(['created_at' => now()->subMinutes(16)])->save();
    $this->actingAs($sender)
        ->deleteJson("/api/v1/messages/{$old->id}", ['scope' => 'for_all'])
        ->assertForbidden();

    $this->actingAs($sender)
        ->deleteJson("/api/v1/messages/{$old->id}")
        ->assertStatus(422);
});

it('hides for_me deletes for the requester only', function () {
    [$sender, $recipient] = batchUsers();
    $conversation = batchConversation($sender, $recipient);
    $message = app(MessagingService::class)->send($sender, $conversation, 'Visible to sender still');

    $this->actingAs($recipient)
        ->deleteJson("/api/v1/messages/{$message->id}", ['scope' => 'for_me'])
        ->assertOk()
        ->assertJsonPath('data.deleted', 'mine')
        ->assertJsonPath('data.body', null)
        ->assertJsonPath('data.attachment', null);

    $senderView = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data.messages');

    $kept = collect($senderView)->firstWhere('id', $message->id);
    expect($kept['deleted'])->toBeNull()->and($kept['body'])->toBe('Visible to sender still');
});

it('toggles reactions and rejects unknown emoji', function () {
    [$sender, $recipient] = batchUsers();
    $conversation = batchConversation($sender, $recipient);
    $message = app(MessagingService::class)->send($sender, $conversation, 'React to this');

    $on = $this->actingAs($recipient)
        ->postJson("/api/v1/messages/{$message->id}/reactions", ['emoji' => '👍'])
        ->assertOk()
        ->json('data.metadata.reactions');

    expect($on['👍'])->toBe([$recipient->id]);

    $off = $this->actingAs($recipient)
        ->postJson("/api/v1/messages/{$message->id}/reactions", ['emoji' => '👍'])
        ->assertOk()
        ->json('data.metadata.reactions');

    expect($off ?? [])->toBe([]);

    $this->actingAs($recipient)
        ->postJson("/api/v1/messages/{$message->id}/reactions", ['emoji' => '💩'])
        ->assertStatus(422);

    $stranger = User::factory()->create();
    $this->actingAs($stranger)
        ->postJson("/api/v1/messages/{$message->id}/reactions", ['emoji' => '❤️'])
        ->assertForbidden();
});

it('creates group conversations without breaking the single flow', function () {
    $creator = asAdmin(User::factory()->create());
    [$first, $second] = batchUsers();

    $group = $this->actingAs($creator)
        ->postJson('/api/v1/messages/conversations', [
            'recipient_ids' => [$first->uuid, $second->uuid],
            'subject' => 'Brake team',
            'message' => 'Welcome aboard',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.type', 'group')
        ->assertJsonPath('data.member_count', 3)
        ->json('data');

    expect($group['participants'])->toHaveCount(3);
    foreach ($group['participants'] as $member) {
        expect($member)->toHaveKeys(['id', 'name'])->not->toHaveKey('email');
    }
    expect(collect($group['participants'])->pluck('id')->all())
        ->toContain($creator->uuid, $first->uuid, $second->uuid);

    // The legacy single-recipient flow still works.
    $this->actingAs($creator)
        ->postJson('/api/v1/messages/conversations', ['recipient_id' => $first->uuid])
        ->assertSuccessful()
        ->assertJsonPath('data.type', 'direct');
});

it('validates group conversation input', function () {
    $creator = asAdmin(User::factory()->create());
    [$first, $second] = batchUsers();

    // Only one recipient.
    $this->actingAs($creator)
        ->postJson('/api/v1/messages/conversations', [
            'recipient_ids' => [$first->uuid],
            'subject' => 'Too small',
        ])
        ->assertStatus(422);

    // Subject is required for groups.
    $this->actingAs($creator)
        ->postJson('/api/v1/messages/conversations', [
            'recipient_ids' => [$first->uuid, $second->uuid],
        ])
        ->assertStatus(422);

    // Duplicate recipients.
    $this->actingAs($creator)
        ->postJson('/api/v1/messages/conversations', [
            'recipient_ids' => [$first->uuid, $first->uuid, $second->uuid],
            'subject' => 'Dupes',
        ])
        ->assertStatus(422);

    // More than eight recipients.
    $crowd = User::factory()->count(9)->create();
    $this->actingAs($creator)
        ->postJson('/api/v1/messages/conversations', [
            'recipient_ids' => $crowd->pluck('uuid')->all(),
            'subject' => 'Crowded',
        ])
        ->assertStatus(422);

    // Uncontactable recipients are forbidden.
    $plain = User::factory()->create();
    [$outsiderA, $outsiderB] = batchUsers();
    $this->actingAs($plain)
        ->postJson('/api/v1/messages/conversations', [
            'recipient_ids' => [$outsiderA->uuid, $outsiderB->uuid],
            'subject' => 'No access',
        ])
        ->assertForbidden();
});

it('paginates threads oldest to newest with has_more', function () {
    [$sender, $recipient] = batchUsers();
    $conversation = batchConversation($sender, $recipient);
    $service = app(MessagingService::class);
    $base = now()->subHours(2);
    $stamps = [];
    for ($i = 1; $i <= 35; $i++) {
        $message = $service->send($sender, $conversation, "Thread message number {$i}");
        $stamp = $base->copy()->addMinutes($i);
        $message->forceFill(['created_at' => $stamp, 'updated_at' => $stamp])->save();
        $stamps[$i] = $stamp;
    }

    $page = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}/messages?per_page=10")
        ->assertOk()
        ->json();

    expect($page['data'])->toHaveCount(10)
        ->and($page['data'][0]['body'])->toBe('Thread message number 26')
        ->and($page['data'][9]['body'])->toBe('Thread message number 35')
        ->and($page['meta']['has_more'])->toBeTrue();

    $older = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}/messages?per_page=10&before={$stamps[30]->toISOString()}")
        ->assertOk()
        ->json();

    expect($older['data'])->toHaveCount(10)
        ->and($older['data'][0]['body'])->toBe('Thread message number 20')
        ->and($older['data'][9]['body'])->toBe('Thread message number 29')
        ->and($older['meta']['has_more'])->toBeTrue();

    // The final window reports no more history.
    $tail = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}/messages?per_page=10&before={$stamps[11]->toISOString()}")
        ->assertOk()
        ->json();

    expect($tail['data'])->toHaveCount(10)
        ->and($tail['data'][0]['body'])->toBe('Thread message number 1')
        ->and($tail['meta']['has_more'])->toBeFalse();

    $stranger = User::factory()->create();
    $this->actingAs($stranger)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}/messages")
        ->assertForbidden();
});

it('searches thread bodies case-insensitively', function () {
    [$sender, $recipient] = batchUsers();
    $conversation = batchConversation($sender, $recipient);
    $service = app(MessagingService::class);
    $service->send($sender, $conversation, 'Regular brake pad check');
    $service->send($sender, $conversation, 'Zebra torque WRENCH inspection');

    $found = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}/messages?search=wrench")
        ->assertOk()
        ->json();

    expect($found['data'])->toHaveCount(1)
        ->and($found['data'][0]['body'])->toContain('WRENCH')
        ->and($found['meta']['has_more'])->toBeFalse();
});

it('caps the daily send volume per sender', function () {
    [$sender, $recipient] = batchUsers();
    $conversation = batchConversation($sender, $recipient);
    $service = app(MessagingService::class);
    for ($i = 0; $i < 200; $i++) {
        $service->send($sender, $conversation, "Bulk message {$i}");
    }

    $this->actingAs($sender)
        ->postJson("/api/v1/messages/conversations/{$conversation->id}/messages", ['body' => 'One too many'])
        ->assertStatus(429);
});

it('defaults read receipts to true and allows opting out', function () {
    $student = User::factory()->create();

    $settings = $this->actingAs($student)
        ->getJson('/api/v1/student/settings')
        ->assertOk()
        ->json('data.privacy');

    expect($settings['send_read_receipts'])->toBeTrue();

    $this->actingAs($student)
        ->patchJson('/api/v1/student/settings/privacy', ['send_read_receipts' => false])
        ->assertOk()
        ->assertJsonPath('data.send_read_receipts', false);

    $refreshed = $this->actingAs($student)
        ->getJson('/api/v1/student/settings')
        ->assertOk()
        ->json('data.privacy');

    expect($refreshed['send_read_receipts'])->toBeFalse();
});
