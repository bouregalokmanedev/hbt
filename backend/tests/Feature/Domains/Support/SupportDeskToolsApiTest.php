<?php

use App\Domains\Support\Models\CannedReply;
use App\Domains\Support\Models\SupportTicket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Student', 'Support'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

function deskAgent(): User
{
    $agent = User::factory()->create();
    $agent->assignRole('Support');

    return $agent;
}

function deskStudent(): User
{
    $student = User::factory()->create();
    $student->assignRole('Student');

    return $student;
}

function deskTicket(array $overrides = []): SupportTicket
{
    return SupportTicket::create(array_merge([
        'user_id' => deskStudent()->id,
        'subject' => 'Cannot access my course',
        'category' => 'technical',
        'priority' => 'high',
        'status' => 'open',
        'level' => 'support',
    ], $overrides));
}

it('lists students with summary counts and blocks students', function () {
    $student = deskStudent();

    $this->actingAs($student)
        ->getJson('/api/v1/support-desk/students')
        ->assertForbidden();

    $agent = deskAgent();

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/students')
        ->assertOk()
        ->assertJsonPath('data.0.email', $student->email)
        ->assertJsonPath('data.0.enrollments_count', 0)
        ->assertJsonPath('data.0.open_tickets', 0);
});

it('returns a student detail with enrollments, certificates and tickets', function () {
    $student = deskStudent();
    $ticket = deskTicket(['user_id' => $student->id]);
    $agent = deskAgent();

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/students/'.$student->uuid)
        ->assertOk()
        ->assertJsonPath('data.email', $student->email)
        ->assertJsonPath('data.summary.open_tickets', 1)
        ->assertJsonPath('data.tickets.0.id', $ticket->id);

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/students/00000000-0000-0000-0000-000000000000')
        ->assertNotFound();
});

it('bulk resolves and closes tickets, skipping already closed ones', function () {
    $agent = deskAgent();
    $open = deskTicket();
    $pending = deskTicket(['status' => 'pending']);
    $closed = deskTicket(['status' => 'closed']);

    $this->actingAs($agent)
        ->postJson('/api/v1/support-desk/tickets/bulk', [
            'ids' => [$open->id, $pending->id, $closed->id],
            'action' => 'resolve',
        ])
        ->assertOk()
        ->assertJsonPath('data.updated', 2)
        ->assertJsonPath('data.skipped', 1);

    expect($open->fresh()->status->value)->toBe('resolved');
    expect($pending->fresh()->status->value)->toBe('resolved');
    expect($closed->fresh()->status->value)->toBe('closed');
});

it('bulk assigns to a support agent and rejects non-staff assignees', function () {
    $agent = deskAgent();
    $ticket = deskTicket();

    $this->actingAs($agent)
        ->postJson('/api/v1/support-desk/tickets/bulk', [
            'ids' => [$ticket->id],
            'action' => 'assign',
            'assignee_id' => $agent->uuid,
        ])
        ->assertOk()
        ->assertJsonPath('data.updated', 1);

    expect($ticket->fresh()->assigned_to)->toBe($agent->id);

    $student = deskStudent();
    $this->actingAs($agent)
        ->postJson('/api/v1/support-desk/tickets/bulk', [
            'ids' => [$ticket->id],
            'action' => 'assign',
            'assignee_id' => $student->uuid,
        ])
        ->assertStatus(422);
});

it('sets and filters by ticket tags', function () {
    $agent = deskAgent();
    $ticket = deskTicket();

    $this->actingAs($agent)
        ->patchJson("/api/v1/support-desk/tickets/{$ticket->id}/tags", ['tags' => ['Billing', 'vip']])
        ->assertOk()
        ->assertJsonPath('data.tags.0', 'billing')
        ->assertJsonPath('data.tags.1', 'vip');

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/tickets?tag=billing')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/tickets?tag=nope')
        ->assertOk()
        ->assertJsonPath('meta.total', 0);
});

it('stores, lists and deletes per-agent canned replies, scoped to the owner', function () {
    $agent = deskAgent();
    $other = deskAgent();

    $this->actingAs($agent)
        ->postJson('/api/v1/support-desk/canned-replies', [
            'title' => 'Password reset',
            'body' => 'Reset from Settings > Security.',
        ])
        ->assertCreated()
        ->assertJsonPath('data.title', 'Password reset');

    $this->actingAs($other)
        ->getJson('/api/v1/support-desk/canned-replies')
        ->assertOk()
        ->assertJsonPath('data', []);

    $reply = CannedReply::query()->where('user_id', $agent->id)->firstOrFail();

    $this->actingAs($other)
        ->deleteJson("/api/v1/support-desk/canned-replies/{$reply->id}")
        ->assertForbidden();

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/canned-replies')
        ->assertOk()
        ->assertJsonPath('data.0.title', 'Password reset');

    $this->actingAs($agent)
        ->deleteJson("/api/v1/support-desk/canned-replies/{$reply->id}")
        ->assertOk();

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/canned-replies')
        ->assertOk()
        ->assertJsonPath('data', []);
});

it('returns an agent leaderboard with load and csat, and blocks students', function () {
    $agent = deskAgent();
    $ticket = deskTicket(['assigned_to' => $agent->id]);

    $this->actingAs(deskStudent())
        ->getJson('/api/v1/support-desk/agents')
        ->assertForbidden();

    $response = $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/agents')
        ->assertOk();

    $row = collect($response->json('data'))->firstWhere('email', $agent->email);
    expect($row)->not->toBeNull();
    expect($row['open'])->toBe(1);
    expect($row['resolved_month'])->toBe(0);

    $ticket->update(['status' => 'resolved', 'resolved_at' => now()]);

    $response = $this->actingAs($agent)->getJson('/api/v1/support-desk/agents')->assertOk();
    $row = collect($response->json('data'))->firstWhere('email', $agent->email);
    expect($row['resolved_month'])->toBe(1);
});
