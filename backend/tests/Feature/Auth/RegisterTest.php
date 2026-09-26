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

    public function test_register_rejects_digits_in_names(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'John123',
            'last_name'  => 'Doe456',
            'email'      => 'digits@example.com',
            'password'   => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['first_name', 'last_name']);
    }

    public function test_register_allows_arabic_and_hyphenated_names(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'محمد',
            'last_name'  => "O'Brien-Smith",
            'email'      => 'arabic@example.com',
            'password'   => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'arabic@example.com',
            'first_name' => 'محمد',
            'last_name' => "O'Brien-Smith",
        ]);
    }

    public function test_register_rejects_duplicate_email_with_actionable_message(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Lokmane',
            'last_name'  => 'Bourega',
            'email'      => 'taken@example.com',
            'password'   => 'Password123!',
            'password_confirmation' => 'Password123!',
        ])->assertCreated();

        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Other',
            'last_name'  => 'User',
            'email'      => 'taken@example.com',
            'password'   => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Validation failed.')
            ->assertJsonPath('errors.email.0', 'This email address is already registered.');
    }

    public function test_public_verification_resend_returns_uniform_response(): void
    {
        $response = $this->postJson('/api/v1/auth/email/resend-unverified', [
            'email' => 'missing-or-verified@example.com',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'If this email needs verification, a new link has been sent.');
    }
}