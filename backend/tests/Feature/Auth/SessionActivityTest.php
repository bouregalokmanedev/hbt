<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class SessionActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_request_updates_session_activity(): void
    {
        $user = User::factory()->create([
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
            'email_verified_at' => now(),
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'lokmane@example.com',
            'password' => 'Password123!',
        ])->assertOk();

        $token = $response->json('data.token');

        $session = UserSession::query()
            ->where('user_id', $user->id)
            ->firstOrFail();

        $oldActivity = Carbon::parse(
            $session->last_activity_at
        );

        Carbon::setTestNow(
            $oldActivity->copy()->addMinutes(10)
        );

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertOk();

        $session->refresh();

        $this->assertTrue(
            Carbon::parse($session->last_activity_at)
                ->greaterThan($oldActivity)
        );
    }
}
