<?php

namespace Tests\Feature\Auth;

use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
    }

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [

            'first_name' => 'Lokmane',
            'last_name'  => 'Bourega',
            'username'   => 'llukkaa_7',
            'email'      => 'lokmane@example.com',
            'password'   => 'Password123!',
            'password_confirmation' => 'Password123!',

        ]);

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user',
                    'token',
                    'token_type',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'lokmane@example.com',
        ]);
    }
}