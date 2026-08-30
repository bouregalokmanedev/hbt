<?php

use App\Domains\Students\Models\StudentSetting;
use App\Models\User;

it('requires authentication to update appearance settings', function () {
    $response = $this->patchJson(
        '/api/v1/student/settings/appearance',
        [
            'appearance' => 'dark',
        ],
    );

    $response->assertUnauthorized();
});

it('allows a student to change appearance', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/appearance',
            [
                'appearance' => 'dark',
            ],
        );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.appearance',
            'dark',
        );
});

it('allows a student to update compact mode', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/appearance',
            [
                'compact_mode' => true,
            ],
        )
        ->assertOk();

    expect(
        StudentSetting::where(
            'user_id',
            $user->id,
        )->value('compact_mode')
    )->toBeTrue();
});

it('allows a student to update reduced motion', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/appearance',
            [
                'reduced_motion' => true,
            ],
        )
        ->assertOk();

    expect(
        StudentSetting::where(
            'user_id',
            $user->id,
        )->value('reduced_motion')
    )->toBeTrue();
});

it('rejects an unsupported appearance', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/appearance',
            [
                'appearance' => 'blue',
            ],
        );

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'appearance',
        ]);
});

it('does not overwrite other appearance settings', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/appearance',
            [
                'appearance' => 'dark',
                'compact_mode' => true,
            ],
        )
        ->assertOk();

    $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/appearance',
            [
                'appearance' => 'light',
            ],
        )
        ->assertOk();

    $settings = StudentSetting::where(
        'user_id',
        $user->id,
    )->first();

    expect($settings->appearance)->toBe('light');
    expect($settings->compact_mode)->toBeTrue();
});