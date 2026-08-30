<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('requires authentication to change password', function () {
    $response = $this->patchJson(
        '/api/v1/student/settings/security/password',
        [
            'current_password' => 'OldPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ],
    );

    $response->assertUnauthorized();
});

it('allows a student to change their password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('OldPassword123!'),
    ]);

    $response = $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/security/password',
            [
                'current_password' => 'OldPassword123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ],
        );

    $response
        ->assertOk()
        ->assertJsonPath(
            'message',
            'Password updated successfully.',
        );

    expect(
        Hash::check(
            'NewPassword123!',
            $user->refresh()->password,
        ),
    )->toBeTrue();
});

it('rejects an incorrect current password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('OldPassword123!'),
    ]);

    $response = $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/security/password',
            [
                'current_password' => 'WrongPassword123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ],
        );

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'current_password',
        ]);
});

it('requires password confirmation', function () {
    $user = User::factory()->create([
        'password' => Hash::make('OldPassword123!'),
    ]);

    $response = $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/security/password',
            [
                'current_password' => 'OldPassword123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'DifferentPassword123!',
            ],
        );

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'password',
        ]);
});

it('rejects a weak password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('OldPassword123!'),
    ]);

    $response = $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/security/password',
            [
                'current_password' => 'OldPassword123!',
                'password' => '123',
                'password_confirmation' => '123',
            ],
        );

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'password',
        ]);
});

it('does not change the password when the current password is incorrect', function () {
    $user = User::factory()->create([
        'password' => Hash::make('OldPassword123!'),
    ]);

    $oldHash = $user->password;

    $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/security/password',
            [
                'current_password' => 'WrongPassword123!',
                'password' => 'NewPassword123!',
                'password_confirmation' => 'NewPassword123!',
            ],
        )
        ->assertUnprocessable();

    expect($user->refresh()->password)
        ->toBe($oldHash);
});