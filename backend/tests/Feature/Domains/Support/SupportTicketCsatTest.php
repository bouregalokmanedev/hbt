<?php

use App\Domains\Notifications\Models\StudentNotification;
use App\Domains\Support\Models\SupportTicket;
use App\Models\User;
use Database\Seeders\AccessControlSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function csatSupportAgent(): User
{
    $agent = User::factory()->create();
    $agent->assignRole('Support');

    return $agent;
}

function csatOpenTicket(User $owner, string $subject = 'Cannot open lesson 3'): array
{
    return test()->actingAs($owner)
        ->postJson('/api/v1/support/tickets', [
            'subject' => $subject,
            'message' => 'The video keeps buffering after ten seconds.',
        ])
        ->assertCreated()
        ->json('data');
}

it('gives the Support role its default permissions', function () {
    $this->seed(AccessControlSeeder::class);

    $agent = User::factory()->create();
    $agent->assignRole('Support');

    expect($agent->hasPermissionTo('support.view'))->toBeTrue()
        ->and($agent->hasPermissionTo('support.reply'))->toBeTrue();
});

it('only lets the owner rate a resolved ticket and reports CSAT on the desk overview', function () {
    $this->seed(AccessControlSeeder::class);

    $owner = User::factory()->create();
    $agent = csatSupportAgent();
    $ticket = csatOpenTicket($owner);

    $this->actingAs($owner)
        ->postJson("/api/v1/support/tickets/{$ticket['id']}/rating", ['rating' => 5])
        ->assertStatus(422);

    $stranger = User::factory()->create();
    $this->actingAs($agent)
        ->postJson("/api/v1/support-desk/tickets/{$ticket['id']}/resolve")
        ->assertOk();

    $this->actingAs($stranger)
        ->postJson("/api/v1/support/tickets/{$ticket['id']}/rating", ['rating' => 5])
        ->assertForbidden();

    $this->actingAs($owner)
        ->postJson("/api/v1/support/tickets/{$ticket['id']}/rating", [
            'rating' => 5,
            'comment' => 'Fast and helpful.',
        ])
        ->assertOk()
        ->assertJsonPath('data.rating', 5)
        ->assertJsonPath('data.rating_comment', 'Fast and helpful.');

    expect($ticket['id'])->not->toBeNull();

    $this->actingAs($agent)
        ->getJson('/api/v1/support-desk/overview')
        ->assertOk()
        ->assertJsonPath('data.csat.average', 5)
        ->assertJsonPath('data.csat.count', 1);
});

it('exposes ticket status publicly only when the matching email is supplied', function () {
    $owner = User::factory()->create(['email' => 'owner@example.com']);
    $ticket = csatOpenTicket($owner, 'Billing question');

    $this->getJson("/api/v1/support/tickets/{$ticket['id']}/status?email=owner@example.com")
        ->assertOk()
        ->assertJsonPath('data.subject', 'Billing question')
        ->assertJsonPath('data.status', 'open');

    $this->getJson("/api/v1/support/tickets/{$ticket['id']}/status?email=someone-else@example.com")
        ->assertNotFound();

    $this->getJson("/api/v1/support/tickets/{$ticket['id']}/status")
        ->assertStatus(422);
});

it('notifies the student when support replies publicly, but not on internal notes', function () {
    $this->seed(AccessControlSeeder::class);

    $owner = User::factory()->create();
    $agent = csatSupportAgent();
    $ticket = csatOpenTicket($owner);

    $this->actingAs($agent)
        ->postJson("/api/v1/support-desk/tickets/{$ticket['id']}/replies", [
            'message' => 'We are looking into it now.',
        ])
        ->assertOk();

    expect(
        StudentNotification::query()
            ->where('user_id', $owner->id)
            ->where('type', 'support')
            ->count()
    )->toBe(1);

    $notification = StudentNotification::query()
        ->where('user_id', $owner->id)
        ->where('type', 'support')
        ->first();

    expect($notification->action_url)->toBe('/support?ticket='.$ticket['id']);

    StudentNotification::query()->delete();

    $this->actingAs($agent)
        ->postJson("/api/v1/support-desk/tickets/{$ticket['id']}/replies", [
            'message' => 'Internal: check with billing.',
            'internal' => true,
        ])
        ->assertOk();

    expect(StudentNotification::query()->where('user_id', $owner->id)->count())->toBe(0);
});
