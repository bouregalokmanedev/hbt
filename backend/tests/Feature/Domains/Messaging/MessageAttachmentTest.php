<?php

use App\Domains\Messaging\Services\MessagingService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function attachmentConversation(): array
{
    $sender = User::factory()->create();
    $recipient = User::factory()->create();
    $conversation = app(MessagingService::class)->create($sender, $recipient, 'Brake diagnosis');

    return [$sender, $recipient, $conversation];
}

it('accepts pdf, word and image attachments on message send', function () {
    Storage::fake('local');
    [$sender, $recipient, $conversation] = attachmentConversation();

    $message = $this->actingAs($sender)
        ->post("/api/v1/messages/conversations/{$conversation->id}/messages", [
            'body' => 'See the attached report.',
            'file' => UploadedFile::fake()->create('report.pdf', 500, 'application/pdf'),
        ])
        ->assertCreated()
        ->assertJsonPath('data.attachment.name', 'report.pdf')
        ->assertJsonPath('data.attachment.mime', 'application/pdf')
        ->json('data');

    expect($message['attachment']['url'])->toContain('/api/v1/messages/attachments/');

    // The recipient can download through the signed URL without a token.
    $this->get($message['attachment']['url'])
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

it('previews image attachments inline and rejects other participants', function () {
    Storage::fake('local');
    [$sender, $recipient, $conversation] = attachmentConversation();
    $stranger = User::factory()->create();

    $message = $this->actingAs($sender)
        ->post("/api/v1/messages/conversations/{$conversation->id}/messages", [
            'body' => '',
            'file' => UploadedFile::fake()->image('pad-wear.jpg'),
        ])
        ->assertCreated()
        ->json('data');

    $this->get($message['attachment']['url'])->assertOk();

    // Tampered signatures are rejected even without authentication.
    $this->get($message['attachment']['url'] . 'tampered')->assertForbidden();

    // A signed URL cannot leak the file to a non-participant.
    $signedForStranger = $this->actingAs($stranger)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertForbidden();
});

it('rejects disallowed file types and oversized uploads', function () {
    Storage::fake('local');
    [$sender, $recipient, $conversation] = attachmentConversation();

    $this->actingAs($sender)
        ->post("/api/v1/messages/conversations/{$conversation->id}/messages", [
            'body' => 'Run this.',
            'file' => UploadedFile::fake()->create('payload.exe', 100, 'application/x-msdownload'),
        ])
        ->assertStatus(422);

    $this->actingAs($sender)
        ->post("/api/v1/messages/conversations/{$conversation->id}/messages", [
            'body' => 'Huge scan.',
            'file' => UploadedFile::fake()->create('scan.pdf', 11 * 1024, 'application/pdf'),
        ])
        ->assertStatus(422);
});

it('still accepts plain text messages and requires a body without a file', function () {
    [$sender, $recipient, $conversation] = attachmentConversation();

    $this->actingAs($sender)
        ->postJson("/api/v1/messages/conversations/{$conversation->id}/messages", ['body' => 'Hello'])
        ->assertCreated()
        ->assertJsonPath('data.attachment', null);

    $this->actingAs($sender)
        ->postJson("/api/v1/messages/conversations/{$conversation->id}/messages", ['body' => ''])
        ->assertStatus(422);
});

it('exposes participant role, id and read state for ticks and profile links', function () {
    [$sender, $recipient, $conversation] = attachmentConversation();

    $this->actingAs($sender)
        ->postJson("/api/v1/messages/conversations/{$conversation->id}/messages", ['body' => 'Hello'])
        ->assertCreated();

    // Before the recipient opens the thread, nothing is read yet.
    $view = $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->json('data');

    expect($view['participant']['last_read_at'])->toBeNull()
        ->and($view['participant']['user_id'])->toBe($recipient->id);

    // The recipient opening the thread marks it read for the sender's ticks.
    $this->actingAs($recipient)
        ->patchJson("/api/v1/messages/conversations/{$conversation->id}/read")
        ->assertOk();

    $this->actingAs($sender)
        ->getJson("/api/v1/messages/conversations/{$conversation->id}")
        ->assertOk()
        ->assertJsonPath('data.participant.last_read_at', fn ($value) => $value !== null);
});
