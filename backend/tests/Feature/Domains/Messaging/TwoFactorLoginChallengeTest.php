<?php

use App\Domains\Students\Models\StudentSecuritySetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns a machine-readable two-factor challenge on login when 2fa is verified', function () {
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
        ->and($response->json('requires_two_factor'))->toBeTrue();
});

it('logs straight in when 2fa is not verified', function () {
    $user = User::factory()->create();

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk();
});

it('resends login codes only for verified accounts', function () {
    $verified = User::factory()->create();
    StudentSecuritySetting::updateOrCreate(
        ['user_id' => $verified->id],
        ['two_factor_enabled' => true, 'two_factor_method' => 'email', 'two_factor_verified_at' => now()]
    );
    $plain = User::factory()->create();

    $this->postJson('/api/v1/auth/two-factor/login/resend', ['email' => $verified->email])
        ->assertOk()
        ->assertJsonPath('data.resent', true);

    $this->postJson('/api/v1/auth/two-factor/login/resend', ['email' => $plain->email])
        ->assertStatus(422);
});
