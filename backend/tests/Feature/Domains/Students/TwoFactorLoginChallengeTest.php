<?php

use App\Domains\Students\Models\StudentSecuritySetting;
use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('returns a machine-readable two-factor challenge on login when 2fa is verified', function () {
    Notification::fake();

    $user = User::factory()->create();
    StudentSecuritySetting::updateOrCreate(
        ['user_id' => $user->id],
        ['two_factor_enabled' => true, 'two_factor_method' => 'email', 'two_factor_verified_at' => now()]
    );

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertStatus(423);
    expect($response->json('message'))->toContain('Two-factor')
        ->and($response->json('requires_two_factor'))->toBeTrue()
        ->and($response->json('challenge_token'))->toBeString()->toHaveLength(64);

    Notification::assertSentTo($user, TwoFactorCodeNotification::class);
});

it('logs straight in when 2fa is not verified', function () {
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk();
});

it('resends login codes only for an active password-backed challenge', function () {
    Notification::fake();

    $verified = User::factory()->create();
    StudentSecuritySetting::updateOrCreate(
        ['user_id' => $verified->id],
        ['two_factor_enabled' => true, 'two_factor_method' => 'email', 'two_factor_verified_at' => now()]
    );
    $plain = User::factory()->create();

    $login = $this->postJson('/api/v1/auth/login', [
        'email' => $verified->email,
        'password' => 'password',
    ])->assertStatus(423);

    $this->postJson('/api/v1/auth/two-factor/login/resend', [
        'email' => $verified->email,
        'challenge_token' => $login->json('challenge_token'),
    ])
        ->assertOk()
        ->assertJsonPath('data.resent', true);

    // An account without 2FA has no valid challenge to resend against.
    $this->postJson('/api/v1/auth/two-factor/login/resend', [
        'email' => $plain->email,
        'challenge_token' => str_repeat('a', 64),
    ])->assertStatus(422);
});
