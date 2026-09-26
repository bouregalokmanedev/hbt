<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('exposes the student ticket endpoints to authenticated students', function () {
    $student = User::factory()->create();

    $this->actingAs($student)
        ->getJson('/api/v1/support/tickets')
        ->assertOk()
        ->assertJsonPath('data.items', [])
        ->assertJsonPath('data.meta.total', 0);

    $ticket = $this->actingAs($student)
        ->postJson('/api/v1/support/tickets', [
            'subject' => 'Cannot open lesson 3',
            'category' => 'courses',
            'priority' => 'high',
            'message' => 'The video keeps buffering after ten seconds.',
        ])
        ->assertCreated()
        ->assertJsonPath('data.subject', 'Cannot open lesson 3')
        ->json('data');

    $this->actingAs($student)
        ->getJson('/api/v1/support/tickets')
        ->assertOk()
        ->assertJsonPath('data.meta.total', 1);

    $this->actingAs($student)
        ->getJson("/api/v1/support/tickets/{$ticket['id']}")
        ->assertOk()
        ->assertJsonPath('data.subject', 'Cannot open lesson 3');

    $this->actingAs($student)
        ->postJson("/api/v1/support/tickets/{$ticket['id']}/reply", ['message' => 'Still happening today.'])
        ->assertOk();

    $this->actingAs($student)
        ->postJson("/api/v1/support/tickets/{$ticket['id']}/close")
        ->assertOk()
        ->assertJsonPath('data.status', 'closed');
});

it('hides other students tickets from the student endpoints', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();

    $ticket = $this->actingAs($owner)
        ->postJson('/api/v1/support/tickets', [
            'subject' => 'Private issue',
            'message' => 'This message is long enough to pass validation.',
        ])
        ->assertCreated()
        ->json('data');

    $this->actingAs($stranger)
        ->getJson("/api/v1/support/tickets/{$ticket['id']}")
        ->assertForbidden();

    $this->actingAs($stranger)
        ->getJson('/api/v1/support/tickets')
        ->assertOk()
        ->assertJsonPath('data.meta.total', 0);
});

it('requires authentication for the student ticket endpoints', function () {
    $this->getJson('/api/v1/support/tickets')->assertUnauthorized();
    $this->postJson('/api/v1/support/tickets', [])->assertUnauthorized();
});
