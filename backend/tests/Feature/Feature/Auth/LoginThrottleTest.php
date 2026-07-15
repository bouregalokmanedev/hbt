<?php

namespace Tests\Feature\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class LoginThrottleTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    public function test_login_is_rate_limited(): void
{
    for ($i = 0; $i < 6; $i++) {

        $this->postJson('/api/v1/auth/login', [

            'email' => 'fake@example.com',

            'password' => 'wrong',

        ]);

    }

    $this->postJson('/api/v1/auth/login', [

        'email' => 'fake@example.com',

        'password' => 'wrong',

    ])
    ->assertStatus(429);
}
}
