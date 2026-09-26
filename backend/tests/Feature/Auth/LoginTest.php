<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user',
                    'token',
                    'token_type',
                ],
            ]);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'tokenable_type' => User::class,
        ]);

        $this->assertDatabaseHas('user_sessions', [
            'user_id' => $user->id,
        ]);
    }

    public function test_login_rejects_invalid_email(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'unknown@example.com',
            'password' => 'Password123!',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Email or password is incorrect.',
                'code' => 'invalid_credentials',
            ]);
    }

    public function test_login_rejects_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'lokmane@example.com',
            'password' => 'WrongPassword123!',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Email or password is incorrect.',
                'code' => 'invalid_credentials',
            ]);
    }

    public function test_unverified_user_cannot_login(): void
    {
        User::factory()->unverified()->create([
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
            'status' => 'pending',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Please verify your email address.',
                'code' => 'email_not_verified',
            ]);
    }

    public function test_inactive_user_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
            'status' => 'suspended',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJson([
                'success' => false,
                'message' => 'Your account is inactive.',
                'code' => 'account_inactive',
            ]);
    }

    public function test_unknown_email_and_wrong_password_share_the_same_message(): void
    {
        User::factory()->create([
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        $unknown = $this->postJson('/api/v1/auth/login', [
            'email' => 'nobody@example.com',
            'password' => 'Password123!',
        ])->json();

        $wrongPassword = $this->postJson('/api/v1/auth/login', [
            'email' => 'lokmane@example.com',
            'password' => 'WrongPassword123!',
        ])->json();

        $this->assertSame($unknown['message'], $wrongPassword['message']);
        $this->assertSame($unknown['code'], $wrongPassword['code']);
    }
}
