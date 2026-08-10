<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MeTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_get_their_profile(): void
    {
        $user = User::factory()->create([
            'first_name' => 'Lokmane',
            'last_name' => 'Bourega',
            'email' => 'lokmane@example.com',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/v1/auth/me');

        $response
            ->assertOk()
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.email', 'lokmane@example.com')
            ->assertJsonPath('data.first_name', 'Lokmane')
            ->assertJsonPath('data.last_name', 'Bourega');

        $response->assertJsonMissing([
            'password' => $user->password,
        ]);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }
}
