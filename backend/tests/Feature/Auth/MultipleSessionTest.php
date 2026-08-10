<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultipleSessionTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_login_becomes_the_current_session(): void
    {
        $user = User::factory()->create([
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        $firstResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $firstToken = $firstResponse->json('data.token');

        $firstSession = UserSession::query()
            ->where('user_id', $user->id)
            ->first();

        $this->assertNotNull($firstSession);
        $this->assertTrue($firstSession->is_current);

        $secondResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $secondToken = $secondResponse->json('data.token');

        $this->assertNotSame($firstToken, $secondToken);

        $sessions = UserSession::query()
            ->where('user_id', $user->id)
            ->get();

        $this->assertCount(2, $sessions);

        $this->assertSame(
            1,
            $sessions->where('is_current', true)->count()
        );
    }

    public function test_current_endpoint_returns_the_current_login_session(): void
    {
        $user = User::factory()->create([
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $secondResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $secondToken = $secondResponse->json('data.token');

        $currentResponse = $this->withToken($secondToken)
            ->getJson('/api/sessions/current')
            ->assertOk();

        $this->assertTrue(
            $currentResponse->json('data.is_current')
        );

        $this->assertNotNull(
            $currentResponse->json('data.id')
        );
    }
}
