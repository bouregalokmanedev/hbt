<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class SessionTest extends TestCase
{
    use RefreshDatabase;

    private function createSession(User $user, bool $current = false): array
    {
        $token = $user->createToken('auth_token');

        $session = UserSession::create([
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
            'is_current' => $current,
        ]);

        return [$token, $session];
    }

    public function test_authenticated_user_can_list_their_sessions(): void
    {
        $user = User::factory()->create();

        [$currentToken] = $this->createSession($user, true);
        $this->createSession($user);

        $response = $this->withToken($currentToken->plainTextToken)
            ->getJson('/api/sessions');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'id',
                        'device_name',
                        'browser',
                        'platform',
                        'device_type',
                        'ip_address',
                        'logged_in_at',
                        'last_activity_at',
                        'logged_out_at',
                        'is_current',
                    ],
                ],
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_session_list_requires_authentication(): void
    {
        $this->getJson('/api/sessions')
            ->assertUnauthorized();
    }

    public function test_authenticated_user_can_get_current_session(): void
    {
        $user = User::factory()->create();

        [$token, $session] = $this->createSession($user, true);

        $response = $this->withToken($token->plainTextToken)
            ->getJson('/api/sessions/current');

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $session->id)
            ->assertJsonPath('data.is_current', true);
    }

    public function test_user_can_revoke_their_own_session(): void
    {
        $user = User::factory()->create();

        [$currentToken] = $this->createSession($user, true);
        [$otherToken, $otherSession] = $this->createSession($user);

        $this->withToken($currentToken->plainTextToken)
            ->deleteJson("/api/sessions/{$otherSession->id}")
            ->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Session revoked.',
            ]);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $otherToken->accessToken->id,
        ]);

        $this->assertDatabaseHas('user_sessions', [
            'id' => $otherSession->id,
            'is_current' => false,
        ]);
    }

    public function test_user_cannot_revoke_another_users_session(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        [$currentToken] = $this->createSession($user, true);
        [, $otherSession] = $this->createSession($otherUser, true);

        $this->withToken($currentToken->plainTextToken)
            ->deleteJson("/api/sessions/{$otherSession->id}")
            ->assertForbidden();
    }

    public function test_user_can_revoke_other_sessions(): void
    {
        $user = User::factory()->create();

        [$currentToken, $currentSession] = $this->createSession($user, true);
        [$otherToken, $otherSession] = $this->createSession($user);
        [$thirdToken, $thirdSession] = $this->createSession($user);

        $this->withToken($currentToken->plainTextToken)
            ->deleteJson('/api/sessions/others')
            ->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Other sessions revoked.',
            ]);

        $this->assertDatabaseHas('personal_access_tokens', [
            'id' => $currentToken->accessToken->id,
        ]);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $otherToken->accessToken->id,
        ]);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $thirdToken->accessToken->id,
        ]);

        $this->assertDatabaseHas('user_sessions', [
            'id' => $currentSession->id,
            'is_current' => true,
        ]);

        $this->assertDatabaseHas('user_sessions', [
            'id' => $otherSession->id,
            'is_current' => false,
        ]);

        $this->assertDatabaseHas('user_sessions', [
            'id' => $thirdSession->id,
            'is_current' => false,
        ]);
    }
}
