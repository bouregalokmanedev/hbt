<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('exposes a healthy readiness probe', function () {
    $response = $this->getJson('/api/v1/health')
        ->assertOk()
        ->assertJsonPath('status', 'ok')
        ->assertJsonPath('success', true)
        ->assertJsonPath('checks.database', 'ok')
        ->assertJsonPath('checks.cache', 'ok')
        ->assertJsonPath('checks.queue', 'ok')
        ->assertJsonPath('checks.storage', 'ok');

    expect($response->headers->get('X-Request-ID'))->not->toBeEmpty();
});

it('exposes a health probe outside the api prefix', function () {
    $this->getJson('/health')
        ->assertOk()
        ->assertJsonPath('status', 'ok');
});

it('echoes a well-formed request id and replaces an invalid one', function () {
    $valid = 'req-12345678-abcd';

    $this->getJson('/api/v1/health', ['X-Request-ID' => $valid])
        ->assertOk()
        ->assertHeader('X-Request-ID', $valid);

    $invalid = $this->getJson('/api/v1/health', ['X-Request-ID' => "bad\nheader"])
        ->assertOk();

    expect($invalid->headers->get('X-Request-ID'))
        ->not->toBe("bad\nheader")
        ->toMatch('/^[0-9a-f-]{36}$/');
});
