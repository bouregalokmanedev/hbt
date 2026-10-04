<?php

use App\Domains\Messaging\Events\MessageSent;
use App\Domains\Messaging\Models\Message;
use App\Domains\Messaging\Models\MessageConversation;
use App\Domains\Messaging\Models\MessageParticipant;
use App\Domains\Messaging\Services\MessagingService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

/** @return array{0: User, 1: User, 2: \App\Domains\Messaging\Models\MessageConversation} */
function featuresPair(): array
{
    $sender = User::factory()->create();
    $recipient = User::factory()->create();

    return [$sender, $recipient, app(MessagingService::class)->create($sender, $recipient, 'Features')];
}

it('lets only the sender edit their own message', function () {
    [$sender, $recipient, $conversation] = featuresPair();

    $message = app(MessagingService::class)->send($sender, $conversation, 'Original');

    $this->actingAs($recipient)
        ->patchJson("/api/v1/messages/{$message->id}", ['body' => 'Hacked'])
        ->assertForbidden();

    $this->actingAs($sender)
        ->patchJson("/api/v1/messages/{$message->id}", ['body' => 'Corrected'])
        ->assertOk()
        ->assertJsonPath('data.body', 'Corrected')
        ->assertJsonPath('data.edited', true)
        ->assertJsonPath('data.edited_at', fn ($value) => $value !== null);

    expect($message->fresh()->body)->toBe('Corrected');
});

it('rejects edits to announcements and to deleted messages', function () {
    [$sender, , $conversation] = featuresPair();

    $announcement = app(MessagingService::class)->send($sender, $conversation, 'Note', 'announcement');

    $this->actingAs($sender)
        ->patchJson("/api/v1/messages/{$announcement->id}", ['body' => 'Nope'])
        ->assertStatus(422);

    $gone = app(MessagingService::class)->send($sender, $conversation, 'Bye');
    $this->actingAs($sender)
        ->deleteJson("/api/v1/messages/{$gone->id}", ['scope' => 'for_all'])
        ->assertOk();

    $this->actingAs($sender)
        ->patchJson("/api/v1/messages/{$gone->id}", ['body' => 'Nope'])
        ->assertNotFound();

    $this->actingAs($sender)
        ->patchJson("/api/v1/messages/{$announcement->id}", ['body' => ''])
        ->assertUnprocessable();
});

it('forwards a message into another conversation the sender may write to', function () {
    [$sender, $recipient, $source] = featuresPair();

    Storage::fake('local');
    $withFile = $this->actingAs($sender)
        ->post("/api/v1/messages/conversations/{$source->id}/messages", [
            'body' => 'Wear the blue suit',
            'file' => UploadedFile::fake()->create('spec.pdf', 50, 'application/pdf'),
        ])
        ->assertCreated()
        ->json('data');

    $other = User::factory()->create();
    $target = app(MessagingService::class)->create($sender, $other, 'Elsewhere');

    $forwarded = $this->actingAs($sender)
        ->postJson("/api/v1/messages/{$withFile['id']}/forward", [
            'conversation_id' => $target->id,
            'comment' => 'FYI',
        ])
        ->assertCreated()
        ->json('data');

    expect($forwarded['body'])->toBe('FYI')
        ->and($forwarded['forwarded_from']['message_id'])->toBe($withFile['id'])
        ->and($forwarded['forwarded_from']['sender_name'])->toBe($sender->full_name)
        ->and($forwarded['attachments'])->toHaveCount(1);

    // The copy carries the origin, never the storage path.
    expect($forwarded['forwarded_from'])->not->toHaveKey('path');

    // Forwarding into a conversation you cannot write to is refused.
    $strangerTarget = app(MessagingService::class)->create(User::factory()->create(), User::factory()->create());
    $this->actingAs($sender)
        ->postJson("/api/v1/messages/{$withFile['id']}/forward", ['conversation_id' => $strangerTarget->id])
        ->assertForbidden();
});

it('keeps a muted conversation in the inbox but out of the sidebar badge', function () {
    [$sender, $recipient, $conversation] = featuresPair();

    app(MessagingService::class)->send($recipient, $conversation, 'Ping');

    expect($this->actingAs($sender)->getJson('/api/v1/notifications/sidebar-badges')->json('data.messages'))->toBe(1);

    $this->actingAs($sender)
        ->patchJson("/api/v1/messages/conversations/{$conversation->id}/mute", ['muted' => true])
        ->assertOk()
        ->assertJsonPath('data.muted', true);

    expect($this->actingAs($sender)->getJson('/api/v1/notifications/sidebar-badges')->json('data.messages'))->toBe(0);

    $listed = $this->actingAs($sender)->getJson('/api/v1/messages/conversations')->assertOk()->json('data');
    expect($listed)->toHaveCount(1)
        ->and($listed[0]['muted'])->toBeTrue()
        ->and($listed[0]['unread_count'])->toBe(1);

    $this->actingAs($sender)
        ->patchJson("/api/v1/messages/conversations/{$conversation->id}/mute", ['muted' => false])
        ->assertOk()
        ->assertJsonPath('data.muted', false);

    expect($this->actingAs($sender)->getJson('/api/v1/notifications/sidebar-badges')->json('data.messages'))->toBe(1);
});

it('shares typing state with the other participants only', function () {
    [$sender, $recipient, $conversation] = featuresPair();

    $this->actingAs($sender)
        ->postJson("/api/v1/messages/conversations/{$conversation->id}/typing")
        ->assertNoContent();

    $asRecipient = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($asRecipient['typing_user_ids'])->toBe([$sender->uuid]);

    // You never appear to be typing to yourself.
    $asSender = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($asSender['typing_user_ids'])->toBe([]);

    // The hint expires on its own — nothing sweeps it.
    $this->travel(MessagingService::TYPING_TTL_SECONDS + 1)->seconds();

    $expired = $this->actingAs($recipient)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($expired['typing_user_ids'])->toBe([]);
});

it('marks a participant online once they touch messaging', function () {
    [$sender, $recipient, $conversation] = featuresPair();

    $cold = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($cold['participant']['online'])->toBeFalse();

    $this->actingAs($recipient)->getJson('/api/v1/messages/conversations');

    $warm = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($warm['participant']['online'])->toBeTrue();

    $this->travel(MessagingService::PRESENCE_TTL_SECONDS + 1)->seconds();

    $expired = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($expired['participant']['online'])->toBeFalse();
});

it('accepts several attachments on one message and serves each by index', function () {
    Storage::fake('local');
    [$sender, , $conversation] = featuresPair();

    $message = $this->actingAs($sender)
        ->post("/api/v1/messages/conversations/{$conversation->id}/messages", [
            'body' => 'Both files',
            'files' => [
                UploadedFile::fake()->create('one.pdf', 20, 'application/pdf'),
                UploadedFile::fake()->create('two.pdf', 20, 'application/pdf'),
                UploadedFile::fake()->create('three.pdf', 20, 'application/pdf'),
            ],
        ])
        ->assertCreated()
        ->json('data');

    expect($message['attachments'])->toHaveCount(3)
        ->and($message['attachment']['name'])->toBe('one.pdf')
        ->and($message['attachments'][1]['url'])->toContain('a=1');

    $this->app['auth']->forgetGuards();
    $this->get($message['attachments'][1]['url'])->assertOk();

    // And the singular field still resolves for older readers.
    $this->get($message['attachment']['url'])->assertOk();
});

it('refuses more than the attachment limit on a single message', function () {
    Storage::fake('local');
    [$sender, , $conversation] = featuresPair();

    $files = [];
    for ($i = 0; $i < MessagingService::ATTACHMENTS_LIMIT + 1; $i++) {
        $files[] = UploadedFile::fake()->create("f{$i}.pdf", 5, 'application/pdf');
    }

    $this->actingAs($sender)
        ->postJson("/api/v1/messages/conversations/{$conversation->id}/messages", [
            'body' => 'Too many',
            'files' => $files,
        ])
        ->assertUnprocessable();
});

it('points at the first unread message until the thread is read', function () {
    [$sender, $recipient, $conversation] = featuresPair();

    $first = app(MessagingService::class)->send($recipient, $conversation, 'First');
    app(MessagingService::class)->send($recipient, $conversation, 'Second');

    $unread = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($unread['first_unread_at'])->toBe($first->created_at->toISOString())
        ->and($unread['unread_count'])->toBe(2);

    $this->actingAs($sender)
        ->patchJson("/api/v1/messages/conversations/{$conversation->id}/read")
        ->assertOk();

    $read = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($read['first_unread_at'])->toBeNull()
        ->and($read['unread_count'])->toBe(0);
});

it('pages the inbox with limit and offset', function () {
    $user = User::factory()->create();
    $service = app(MessagingService::class);

    $conversations = [];
    foreach (range(1, 5) as $index) {
        $conversation = $service->create($user, User::factory()->create());
        $service->send(User::factory()->create(), $conversation, "Message {$index}");
        $conversations[] = $conversation->id;
    }

    $firstPage = $this->actingAs($user)
        ->getJson('/api/v1/messages/conversations?limit=2')
        ->assertOk()
        ->json('data');

    $secondPage = $this->actingAs($user)
        ->getJson('/api/v1/messages/conversations?limit=2&offset=2')
        ->assertOk()
        ->json('data');

    $lastPage = $this->actingAs($user)
        ->getJson('/api/v1/messages/conversations?limit=2&offset=4')
        ->assertOk()
        ->json('data');

    expect($firstPage)->toHaveCount(2)
        ->and($secondPage)->toHaveCount(2)
        ->and($lastPage)->toHaveCount(1)
        // Pages must be disjoint (no repeats) and together cover everything.
        ->and(array_intersect(
            array_column($firstPage, 'id'),
            array_column($secondPage, 'id'),
            array_column($lastPage, 'id')
        ))->toBe([])
        ->and(array_merge(
            array_column($firstPage, 'id'),
            array_column($secondPage, 'id'),
            array_column($lastPage, 'id')
        ))->toEqualCanonicalizing($conversations);
});

it('builds messaging fixtures from factories without touching the service', function () {
    $conversation = MessageConversation::factory()->group()->create();
    $message = Message::factory()->withAttachment('message-attachments/x/a.pdf')->create([
        'conversation_id' => $conversation->id,
    ]);
    $participant = MessageParticipant::factory()->read()->create([
        'conversation_id' => $conversation->id,
        'user_id' => $message->sender_id,
    ]);

    expect($conversation->type)->toBe('group')
        ->and($conversation->status)->toBe('active')
        ->and($message->attachments())->toHaveCount(1)
        ->and($participant->last_read_at)->not->toBeNull();

    expect(MessageConversation::factory()->staffRoom()->create()->type)->toBe('staff_room');
    expect(Message::factory()->announcement()->create()->message_type)->toBe('announcement');
    expect(Message::factory()->deletedForEveryone()->create()->isDeletedForAll())->toBeTrue();
    expect(MessageParticipant::factory()->muted()->create()->muted_at)->not->toBeNull();
});

it('announces a committed message so other domains can subscribe', function () {
    [$sender, , $conversation] = featuresPair();

    Event::fake([MessageSent::class]);

    $message = app(MessagingService::class)->send($sender, $conversation, 'Hello');

    Event::assertDispatched(MessageSent::class, fn (MessageSent $event): bool => $event->message->is($message)
        && $event->conversation->is($conversation)
        && $event->sender->is($sender));
});
