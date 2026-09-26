<?php

use App\Domains\Students\Models\StudentSecuritySetting;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;

/**
 * 2FA storage and the login challenge are role-agnostic — only the student
 * settings UI used to expose enable/verify. These tests prove Support,
 * Instructor, and Admin accounts can turn 2FA on and are then challenged
 * at login.
 */
function enableTwoFactorFor(object $testCase, User $user): void
{
    Notification::fake();

    $testCase->actingAs($user)
        ->postJson('/api/v1/student/settings/security/two-factor/enable', ['method' => 'email'])
        ->assertOk()
        ->assertJsonPath('data.verification_required', true);

    $code = null;
    Notification::assertSentTo(
        $user,
        \App\Notifications\TwoFactorCodeNotification::class,
        function (\App\Notifications\TwoFactorCodeNotification $notification) use (&$code) {
            $code = $notification->code;

            return true;
        }
    );

    expect($code)->toBeString();

    $testCase->actingAs($user)
        ->postJson('/api/v1/student/settings/security/two-factor/verify', [
            'code' => $code,
            'method' => 'email',
        ])
        ->assertOk()
        ->assertJsonPath('data.two_factor_enabled', true);
}

it('lets a support agent enable two-factor and challenges their login', function () {
    Notification::fake();
    Role::findOrCreate('Support', 'web');
    $user = User::factory()->create();
    $user->assignRole('Support');

    enableTwoFactorFor($this, $user);

    expect(
        StudentSecuritySetting::where('user_id', $user->id)->first()?->two_factor_enabled,
    )->toBeTrue();

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertStatus(423)->assertJsonPath('requires_two_factor', true);
});

it('lets an instructor enable two-factor and challenges their login', function () {
    Notification::fake();
    Role::findOrCreate('Instructor', 'web');
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    enableTwoFactorFor($this, $user);

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertStatus(423)->assertJsonPath('requires_two_factor', true);
});

it('lets an admin enable two-factor and challenges their login', function () {
    Notification::fake();
    Role::findOrCreate('Admin', 'web');
    $user = User::factory()->create();
    $user->assignRole('Admin');

    enableTwoFactorFor($this, $user);

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertStatus(423)->assertJsonPath('requires_two_factor', true);
});

it('lets a support agent disable two-factor with their account password', function () {
    Notification::fake();
    Role::findOrCreate('Support', 'web');
    $user = User::factory()->create();
    $user->assignRole('Support');

    enableTwoFactorFor($this, $user);

    $this->actingAs($user)
        ->deleteJson('/api/v1/student/settings/security/two-factor', [
            'current_password' => 'password',
        ])
        ->assertOk()
        ->assertJsonPath('data.two_factor_enabled', false);

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk();
});

it('rejects disabling two-factor without the account password', function () {
    Notification::fake();
    $user = User::factory()->create();

    enableTwoFactorFor($this, $user);

    $this->actingAs($user)
        ->deleteJson('/api/v1/student/settings/security/two-factor')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['current_password']);

    expect(
        StudentSecuritySetting::where('user_id', $user->id)->first()?->two_factor_enabled,
    )->toBeTrue();
});

it('rejects disabling two-factor with a wrong password', function () {
    Notification::fake();
    $user = User::factory()->create();

    enableTwoFactorFor($this, $user);

    $this->actingAs($user)
        ->deleteJson('/api/v1/student/settings/security/two-factor', [
            'current_password' => 'not-the-password',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['current_password']);

    expect(
        StudentSecuritySetting::where('user_id', $user->id)->first()?->two_factor_enabled,
    )->toBeTrue();
});
