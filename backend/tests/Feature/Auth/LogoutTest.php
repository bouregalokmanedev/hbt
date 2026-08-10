<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();

        $token = $user->createToken('auth_token');

        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $token->accessToken->id,
        ]);

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Logged out successfully.',
            ]);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $token->accessToken->id,
        ]);
    }

    public function test_logout_requires_authentication(): void
    {
        $this->postJson('/api/v1/auth/logout')
            ->assertUnauthorized();
    }

    public function test_logout_closes_the_current_session(): void
    {
        $user = User::factory()->create();

        $token = $user->createToken('auth_token');

        UserSession::create([
            'user_id' => $user->id,
            'token_id' => $token->accessToken->id,
            'device_name' => 'Test Device',
            'browser' => 'Test Browser',
            'platform' => 'Test Platform',
            'device_type' => 'desktop',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
            'logged_in_at' => now(),
            'last_activity_at' => now(),
            'is_current' => true,
        ]);

        $this->withToken($token->plainTextToken)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertDatabaseHas('user_sessions', [
            'user_id' => $user->id,
            'token_id' => $token->accessToken->id,
            'is_current' => false,
        ]);

        $this->assertDatabaseMissing('user_sessions', [
            'user_id' => $user->id,
            'token_id' => $token->accessToken->id,
            'logged_out_at' => null,
        ]);
    }
}
