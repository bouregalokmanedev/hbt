<?php

use App\Domains\Simulator\Models\SimulatorSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function simCompletionSession(User $user, array $overrides = []): SimulatorSession
{
    return SimulatorSession::create(array_merge([
        'user_id' => $user->id,
        'vehicle_key' => 'corolla-1zr-fe',
        'tool' => 'scanner',
        'scenario_key' => 'fuel-starvation',
        'status' => 'active',
        'started_at' => now()->subMinutes(5),
    ], $overrides));
}

it('rejects a scored completion without procedure steps', function () {
    $user = User::factory()->create();
    $session = simCompletionSession($user);

    $this->actingAs($user)
        ->postJson("/api/v1/simulator/sessions/{$session->id}/complete", [
            'score' => 90,
            'steps' => [],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('steps');

    expect($session->fresh()->status)->toBe('active');
});

it('computes duration on the server instead of trusting the client', function () {
    $user = User::factory()->create();
    $session = simCompletionSession($user);

    $this->actingAs($user)
        ->postJson("/api/v1/simulator/sessions/{$session->id}/complete", [
            'score' => 80,
            'duration_seconds' => 1,
            'steps' => [['label' => 'read-codes', 'ok' => true]],
        ])
        ->assertOk();

    $result = $session->fresh();

    expect($result->status)->toBe('completed')
        ->and($result->duration_seconds)->toBeGreaterThanOrEqual(295)
        ->and($result->duration_seconds)->toBeLessThanOrEqual(305);
});

it('does not let a session be completed twice', function () {
    $user = User::factory()->create();
    $session = simCompletionSession($user);

    $payload = [
        'score' => 70,
        'steps' => [['label' => 'read-codes', 'ok' => true]],
    ];

    $this->actingAs($user)
        ->postJson("/api/v1/simulator/sessions/{$session->id}/complete", $payload)
        ->assertOk();

    $this->actingAs($user)
        ->postJson("/api/v1/simulator/sessions/{$session->id}/complete", $payload)
        ->assertStatus(422)
        ->assertJsonValidationErrors('session');
});

it('does not let a learner complete someone elses session', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $session = simCompletionSession($owner);

    $this->actingAs($intruder)
        ->postJson("/api/v1/simulator/sessions/{$session->id}/complete", [
            'score' => 70,
            'steps' => [['label' => 'read-codes', 'ok' => true]],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('session');

    expect($session->fresh()->status)->toBe('active');
});
