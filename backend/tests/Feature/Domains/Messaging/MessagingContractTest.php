<?php

use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Models\MessageParticipant;
use App\Domains\Messaging\Services\MessagingService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/** @return array{0: User, 1: User, 2: \App\Domains\Messaging\Models\MessageConversation} */
function contractPair(): array
{
    $sender = User::factory()->create();
    $recipient = User::factory()->create();

    return [$sender, $recipient, app(MessagingService::class)->create($sender, $recipient, 'Contract')];
}

it('serves signed attachment downloads without a bearer token', function () {
    \Illuminate\Support\Facades\Storage::fake('local');
    [$sender, , $conversation] = contractPair();

    $message = $this->actingAs($sender)
        ->post("/api/v1/messages/conversations/{$conversation->id}/messages", [
            'body' => 'Report attached',
            'file' => \Illuminate\Http\UploadedFile::fake()->create('report.pdf', 200, 'application/pdf'),
        ])
        ->assertCreated()
        ->json('data');

    expect($message['attachment']['url'])->toContain('viewer=' . $sender->uuid);

    // Drop the authenticated session entirely: a bare <img>/<a> fetch is the
    // whole point of the signed URL.
    $this->app['auth']->forgetGuards();

    $this->get($message['attachment']['url'])
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('refuses an attachment url retargeted at another viewer', function () {
    \Illuminate\Support\Facades\Storage::fake('local');
    [$sender, $recipient, $conversation] = contractPair();

    $message = $this->actingAs($sender)
        ->post("/api/v1/messages/conversations/{$conversation->id}/messages", [
            'body' => 'Report attached',
            'file' => \Illuminate\Http\UploadedFile::fake()->create('report.pdf', 200, 'application/pdf'),
        ])
        ->assertCreated()
        ->json('data');

    // The query string is signed, so swapping `viewer` invalidates the URL.
    $retargeted = preg_replace('/viewer=[^&]+/', 'viewer=' . $recipient->uuid, $message['attachment']['url']);
    $this->app['auth']->forgetGuards();
    $this->get($retargeted)->assertForbidden();
});

it('never leaks the internal metadata blob', function () {
    [$sender, $recipient, $conversation] = contractPair();

    $this->actingAs($sender)
        ->postJson("/api/v1/messages/conversations/{$conversation->id}/messages", ['body' => 'Hi'])
        ->assertCreated()
        ->assertJsonMissingPath('data.metadata');

    $message = \App\Domains\Messaging\Models\Message::query()->firstOrFail();
    $this->actingAs($sender)
        ->postJson("/api/v1/messages/{$message->id}/reactions", ['emoji' => '👍'])
        ->assertOk()
        ->assertJsonMissingPath('data.metadata')
        ->assertJsonPath('data.reactions.👍', [$sender->id]);

    // Tombstones must not expose who hid the message from themselves.
    $this->actingAs($sender)
        ->deleteJson("/api/v1/messages/{$message->id}", ['scope' => 'for_me'])
        ->assertOk()
        ->assertJsonMissingPath('data.metadata');
});

it('suppresses read receipts for participants who opted out', function () {
    [$sender, $recipient, $conversation] = contractPair();

    $this->actingAs($sender)
        ->postJson("/api/v1/messages/conversations/{$conversation->id}/messages", ['body' => 'Did you see this?'])
        ->assertCreated();

    $this->actingAs($recipient)
        ->patchJson('/api/v1/student/settings/privacy', ['send_read_receipts' => false])
        ->assertOk();

    $this->actingAs($recipient)
        ->patchJson("/api/v1/messages/conversations/{$conversation->id}/read")
        ->assertOk();

    $view = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    // The row still exists internally — it drives the recipient's own unread
    // badge — it just must never be visible to anyone else.
    expect($view['participant']['last_read_at'])->toBeNull();

    foreach ($view['participants'] ?? [] as $member) {
        if ($member['name'] === $recipient->full_name) {
            expect($member['last_read_at'])->toBeNull();
        }
    }

    $this->actingAs($recipient)
        ->patchJson('/api/v1/student/settings/privacy', ['send_read_receipts' => true])
        ->assertOk();

    $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->assertJsonPath('data.participant.last_read_at', fn ($value) => $value !== null);
});

it('lets either side of a direct conversation archive it, but only the author of a group', function () {
    [$sender, $recipient, $conversation] = contractPair();

    $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->assertJsonPath('data.can_archive', true);

    // The person who did not start the 1:1 can still dismiss it.
    $this->actingAs($recipient)
        ->patchJson("/api/v1/messages/conversations/{$conversation->id}/archive")
        ->assertNoContent();

    $groupOwner = User::factory()->create();
    $member = User::factory()->create();
    $group = app(MessagingService::class)->createGroup($groupOwner, [$member], 'Pit crew');

    $this->actingAs($member)
        ->getJson("/api/v1/messages/conversations/{$group->id}")
        ->assertOk()
        ->assertJsonPath('data.can_archive', false);

    $this->actingAs($member)
        ->patchJson("/api/v1/messages/conversations/{$group->id}/archive")
        ->assertForbidden();

    $this->actingAs($groupOwner)
        ->patchJson("/api/v1/messages/conversations/{$group->id}/archive")
        ->assertNoContent();
});

it('still validates a recipient the contact picker would truncate', function () {
    // The picker caps its own list; permission must not inherit that cap or a
    // valid recipient becomes unreachable once the directory grows.
    $sender = User::factory()->create();
    \Spatie\Permission\Models\Role::findOrCreate('Admin', 'web');
    $sender->assignRole('Admin');

    $crowd = User::factory()->count(251)->create()->values();
    $last = $crowd[250];

    $service = app(MessagingService::class);

    expect($service->contactsFor($sender)->count())->toBe(250)
        ->and($service->canContact($sender, $last))->toBeTrue()
        ->and($service->canContact($sender, $sender))->toBeFalse();
});

it('counts unread conversations with a single grouped query', function () {
    [$sender, $recipient, $conversation] = contractPair();

    app(MessagingService::class)->send($recipient, $conversation, 'One');
    app(MessagingService::class)->send($recipient, $conversation, 'Two');

    $before = $this->actingAs($sender)
        ->getJson('/api/v1/notifications/sidebar-badges')
        ->assertOk()
        ->json('data');

    expect($before['messages'])->toBe(2);

    $this->actingAs($sender)
        ->patchJson("/api/v1/messages/conversations/{$conversation->id}/read")
        ->assertOk();

    $after = $this->actingAs($sender)
        ->getJson('/api/v1/notifications/sidebar-badges')
        ->assertOk()
        ->json('data');

    expect($after['messages'])->toBe(0);
});

it('bounds the inbox instead of returning every conversation forever', function () {
    $user = User::factory()->create();
    $service = app(MessagingService::class);

    $service->create($user, User::factory()->create());
    $service->create($user, User::factory()->create());

    $default = $this->actingAs($user)->getJson('/api/v1/messages/conversations')->assertOk();
    expect($default->json('data'))->toHaveCount(2);

    $bounded = $this->actingAs($user)->getJson('/api/v1/messages/conversations?limit=1')->assertOk();
    expect($bounded->json('data'))->toHaveCount(1);

    $this->actingAs($user)->getJson('/api/v1/messages/conversations?limit=999')->assertUnprocessable();
});

it('scopes the inbox by type so paging never returns rows the mode discards', function () {
    $user = User::factory()->create();
    $service = app(MessagingService::class);

    $service->create($user, User::factory()->create());
    $service->create($user, User::factory()->create());
    $announcement = MessageConversation::create(['created_by' => $user->id, 'type' => 'announcement']);
    MessageParticipant::create(['conversation_id' => $announcement->id, 'user_id' => $user->id]);

    $direct = $this->actingAs($user)
        ->getJson('/api/v1/messages/conversations?type=not_announcement')
        ->assertOk()
        ->json('data');
    expect(collect($direct)->pluck('type')->all())->each->toBe('direct');

    $announcements = $this->actingAs($user)
        ->getJson('/api/v1/messages/conversations?type=announcement')
        ->assertOk()
        ->json('data');
    expect($announcements)->toHaveCount(1)
        ->and($announcements[0]['type'])->toBe('announcement');

    $room = $this->actingAs($user)
        ->getJson('/api/v1/messages/conversations?type=staff_room')
        ->assertOk()
        ->json('data');
    expect($room)->toBeEmpty();

    $this->actingAs($user)->getJson('/api/v1/messages/conversations?type=message')->assertUnprocessable();
});

/**
 * The web client ships its own copies of these constants (`messages.api.ts`).
 * Reading that file from the test makes a one-sided edit fail here instead of
 * in production, where it would silently disable "delete for everyone" or
 * reject every upload the frontend offers.
 */
it('keeps the shared messaging contract in sync with the web client', function () {
    $client = dirname(__DIR__, 5) . '/frontend/src/features/messages/api/messages.api.ts';
    expect(file_exists($client))->toBeTrue('messages.api.ts not found at ' . $client);
    $source = (string) file_get_contents($client);

    // `10 * 1024 * 1024` — resolve the arithmetic rather than matching a literal.
    preg_match('/ATTACHMENT_MAX_BYTES\s*=\s*([0-9\s*+]+)/', $source, $bytes);
    expect($bytes)->not->toBeEmpty('ATTACHMENT_MAX_BYTES missing from messages.api.ts');
    $resolved = array_reduce(array_map('intval', explode('*', $bytes[1])), fn (int $carry, int $factor): int => $carry * $factor, 1);
    expect($resolved)->toBe(MessagingService::ATTACHMENT_MAX_KB * 1024);

    preg_match('/MESSAGE_REACTIONS\s*=\s*\[(.*?)\]/s', $source, $reactions);
    expect($reactions)->not->toBeEmpty('MESSAGE_REACTIONS missing from messages.api.ts');
    preg_match_all('/"([^"]+)"/u', $reactions[1], $emojis);
    expect($emojis[1])->toBe(MessagingService::REACTIONS);

    preg_match('/ATTACHMENT_ACCEPT\s*=\s*"([^"]+)"/', $source, $accept);
    expect($accept)->not->toBeEmpty('ATTACHMENT_ACCEPT missing from messages.api.ts');
    // The value mixes dot-extensions with MIME types; only the former mirror
    // `mimes:` in the upload rule.
    $extensions = array_map(
        fn (string $entry): string => ltrim($entry, '.'),
        array_filter(array_map('trim', explode(',', $accept[1])), fn (string $entry): bool => str_starts_with($entry, '.'))
    );
    expect($extensions)->toEqualCanonicalizing(MessagingService::ATTACHMENT_MIMES);

    preg_match('/windowMinutes\s*=\s*(\d+)/', $source, $window);
    expect($window)->not->toBeEmpty('delete window missing from messages.api.ts')
        ->and((int) $window[1])->toBe(MessagingService::DELETE_FOR_ALL_MINUTES);
});

it('declares the staff room type in exactly one place', function () {
    // Every file in the messaging domain may mention the type only through
    // the constants — a stray literal is how the room gets duplicated.
    $files = iterator_to_array(new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(app_path('Domains/Messaging'), FilesystemIterator::SKIP_DOTS)
    ));

    $literals = [];
    foreach ($files as $file) {
        if ($file->getExtension() !== 'php') {
            continue;
        }
        preg_match_all("/'staff_room'/", (string) file_get_contents($file->getPathname()), $matches);
        if ($matches[0] !== []) {
            $literals[$file->getPathname()] = count($matches[0]);
        }
    }

    expect($literals)->toHaveCount(1, 'staff_room literals found in: ' . implode(', ', array_keys($literals)))
        ->and(array_values($literals)[0])->toBe(1)
        ->and(str_ends_with(array_keys($literals)[0], 'Models/MessageConversation.php'))->toBeTrue();

    expect(MessageConversation::STAFF_ROOM_TYPE)->toBe('staff_room')
        ->and(MessagingService::STAFF_ROOM_TYPE)->toBe(MessageConversation::STAFF_ROOM_TYPE)
        ->and(MessagingService::INBOX_TYPES)->toEqual(MessageConversation::TYPES);
});

it('refuses to persist a conversation type it does not know', function () {
    expect(fn () => MessageConversation::factory()->create(['type' => 'secret_channel']))
        ->toThrow(InvalidArgumentException::class, 'Unknown conversation type');

    foreach (MessageConversation::TYPES as $type) {
        expect(MessageConversation::factory()->create(['type' => $type])->type)->toBe($type);
    }

    // The column default still applies when nothing sets it.
    expect(MessageConversation::factory()->create(['type' => null])->type)->toBe('direct');
});
