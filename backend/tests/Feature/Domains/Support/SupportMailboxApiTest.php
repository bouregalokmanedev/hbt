<?php

use App\Domains\Support\Models\SupportMail;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Instructor', 'Student', 'Support'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

function mailboxAgent(): User
{
    $agent = User::factory()->create();
    $agent->assignRole('Support');

    return $agent;
}

function mailboxInbound(array $overrides = []): SupportMail
{
    $contact = ContactMessage::create(array_merge([
        'first_name' => 'Nadia',
        'last_name' => 'Bensalem',
        'email' => 'nadia@example.com',
        'subject' => 'Cannot access my certificate',
        'message' => 'The download link for my certificate returns a 404 error.',
    ], $overrides));

    return SupportMail::create([
        'direction' => SupportMail::DIRECTION_INBOUND,
        'subject' => $contact->subject,
        'body' => $contact->message,
        'from_name' => $contact->full_name,
        'from_email' => $contact->email,
        'to_email' => 'support@hbtronics.dz',
        'contact_message_id' => $contact->id,
        'created_at' => now()->subHour(),
    ]);
}

it('lists inbox threads with folder counts and blocks students', function () {
    mailboxInbound();
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/support-desk/mail')
        ->assertForbidden();

    $agent = mailboxAgent();

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/mail?folder=inbox')
        ->assertOk()
        ->assertJsonPath('data.0.subject', 'Cannot access my certificate')
        ->assertJsonPath('data.0.read', false)
        ->assertJsonPath('summary.inbox', 1)
        ->assertJsonPath('summary.inbox_unread', 1)
        ->assertJsonPath('summary.sent', 0);
});

it('marks a thread read on open and returns the whole conversation', function () {
    $mail = mailboxInbound();
    $agent = mailboxAgent();

    $this->actingAs($agent)
        ->getJson("/api/v1/support-desk/mail/{$mail->id}")
        ->assertOk()
        ->assertJsonPath('data.subject', 'Cannot access my certificate')
        ->assertJsonPath('data.read', true)
        ->assertJsonPath('data.messages.0.body', 'The download link for my certificate returns a 404 error.')
        ->assertJsonPath('data.messages.0.direction', 'inbound');

    expect($mail->fresh()->read_at)->not->toBeNull();
});

it('replies to an inbound thread and lands the reply in the sent folder', function () {
    $mail = mailboxInbound();
    $agent = mailboxAgent();

    $this->actingAs($agent)
        ->postJson("/api/v1/support-desk/mail/{$mail->id}/reply", [
            'body' => 'Thanks Nadia — we regenerated the link, please try again in a few minutes.',
        ])
        ->assertOk()
        ->assertJsonPath('data.messages.1.direction', 'outbound')
        ->assertJsonPath('data.messages.1.to_email', 'nadia@example.com');

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/mail?folder=inbox')
        ->assertOk()
        ->assertJsonPath('data.0.message_count', 1)
        ->assertJsonPath('summary.inbox_unread', 1);

    $reply = SupportMail::query()->whereNotNull('thread_id')->firstOrFail();
    expect($reply->thread_id)->toBe($mail->id)
        ->and($reply->sender_user_id)->toBe($agent->id)
        ->and($reply->from_email)->toBe($agent->email);
});

it('rejects an empty reply body', function () {
    $mail = mailboxInbound();

    $this->actingAs(mailboxAgent())
        ->postJson("/api/v1/support-desk/mail/{$mail->id}/reply", ['body' => ''])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['body']);
});

it('composes a new outbound thread to a student', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');
    $agent = mailboxAgent();

    $thread = $this->actingAs($agent)
        ->postJson('/api/v1/support-desk/mail', [
            'to_email' => $student->email,
            'to_name' => $student->full_name,
            'recipient_user_id' => $student->uuid,
            'subject' => 'Your subscription renews tomorrow',
            'body' => 'This is a reminder that your monthly plan renews tomorrow.',
        ])
        ->assertCreated()
        ->assertJsonPath('data.subject', 'Your subscription renews tomorrow')
        ->assertJsonPath('data.direction', 'outbound')
        ->json('data');

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/mail?folder=sent')
        ->assertOk()
        ->assertJsonPath('data.0.id', $thread['id'])
        ->assertJsonPath('summary.sent', 1);

    expect(SupportMail::query()->find($thread['id'])?->recipient_user_id)->toBe($student->id);
});

it('archives and restores a conversation', function () {
    $mail = mailboxInbound();
    $agent = mailboxAgent();

    $this->actingAs($agent)
        ->patchJson("/api/v1/support-desk/mail/{$mail->id}/archive", ['archived' => true])
        ->assertOk()
        ->assertJsonPath('data.archived', true);

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/mail?folder=inbox')
        ->assertOk()
        ->assertJsonPath('summary.inbox', 0);

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/mail?folder=archive')
        ->assertOk()
        ->assertJsonPath('data.0.id', $mail->id)
        ->assertJsonPath('summary.archive', 1);

    $this->actingAs($agent)
        ->patchJson("/api/v1/support-desk/mail/{$mail->id}/archive", ['archived' => false])
        ->assertOk()
        ->assertJsonPath('data.archived', false);
});

it('marks a thread unread again', function () {
    $mail = mailboxInbound();
    $agent = mailboxAgent();

    $this->actingAs($agent)
        ->patchJson("/api/v1/support-desk/mail/{$mail->id}/read", ['read' => false])
        ->assertOk()
        ->assertJsonPath('data.read', false);

    expect($mail->fresh()->read_at)->toBeNull();
});

it('searches threads by subject and sender', function () {
    mailboxInbound();
    mailboxInbound([
        'first_name' => 'Karim',
        'last_name' => null,
        'email' => 'karim@example.com',
        'subject' => 'Billing question about my invoice',
        'message' => 'I was charged twice for the same month, please check.',
    ]);
    $agent = mailboxAgent();

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/mail?search=certificate')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.subject', 'Cannot access my certificate');

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/mail?search=karim@example.com')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.subject', 'Billing question about my invoice');
});

it('mirrors public contact-form submissions into the inbox', function () {
    $this->postJson('/api/v1/contact', [
        'first_name' => 'Sofia',
        'last_name' => 'Mansouri',
        'email' => 'sofia@example.com',
        'subject' => 'Question about the simulator lab',
        'message' => 'Does the simulator lab require a modern browser to run?',
    ])->assertCreated();

    expect(SupportMail::query()->count())->toBe(1);

    $this->actingAs(mailboxAgent())
        ->getJson('/api/v1/support-desk/mail?folder=inbox')
        ->assertOk()
        ->assertJsonPath('data.0.subject', 'Question about the simulator lab')
        ->assertJsonPath('data.0.from_email', 'sofia@example.com');
});

it('offers students as compose recipients', function () {
    $student = User::factory()->create(['first_name' => 'Yacine', 'last_name' => 'Hamidi']);
    $student->assignRole('Student');
    User::factory()->create()->assignRole('Instructor');

    $recipients = $this->actingAs(mailboxAgent())
        ->getJson('/api/v1/support-desk/mail/recipients?search=yacine')
        ->assertOk()
        ->json('data');

    expect($recipients)->toHaveCount(1)
        ->and($recipients[0]['email'])->toBe($student->email)
        ->and($recipients[0]['name'])->toBe('Yacine Hamidi');
});

it('requires staff authentication for every mailbox route', function () {
    $mail = mailboxInbound();
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)->getJson('/api/v1/support-desk/mail')->assertForbidden();
    $this->actingAs($student)->getJson("/api/v1/support-desk/mail/{$mail->id}")->assertForbidden();
    $this->actingAs($student)->getJson('/api/v1/support-desk/mail/recipients')->assertForbidden();
});

it('rejects anonymous mailbox requests', function () {
    $this->postJson('/api/v1/support-desk/mail')->assertUnauthorized();
});
