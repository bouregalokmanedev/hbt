<?php

namespace Tests\Feature\Security;

use App\Models\ContactMessage;
use App\Models\User;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

final class BotProtectionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesSeeder::class);
    }

    private function registrationPayload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Lokmane',
            'last_name' => 'Bourega',
            'email' => 'bot-test@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ], $overrides);
    }

    private function contactPayload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Sofia',
            'last_name' => 'Mansouri',
            'email' => 'sofia@example.com',
            'subject' => 'Question about the simulator lab',
            'message' => 'Does the simulator lab require a modern browser to run?',
        ], $overrides);
    }

    private function enableTurnstile(): void
    {
        config([
            'services.bot_protection.turnstile.enabled' => true,
            'services.bot_protection.turnstile.site_key' => 'site-key',
            'services.bot_protection.turnstile.secret_key' => 'secret-key',
        ]);
    }

    public function test_registration_rejects_a_filled_honeypot(): void
    {
        $this
            ->postJson('/api/v1/auth/register', $this->registrationPayload([
                'website' => 'https://spam.example',
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseMissing('users', [
            'email' => 'bot-test@example.com',
        ]);
    }

    public function test_login_rejects_a_filled_honeypot_before_checking_credentials(): void
    {
        User::factory()->create([
            'email' => 'learner@example.com',
            'password' => 'Password123!',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'learner@example.com',
            'password' => 'Password123!',
            'website' => 'https://spam.example',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_contact_form_rejects_a_filled_honeypot(): void
    {
        $this->postJson('/api/v1/contact', $this->contactPayload([
            'website' => 'https://spam.example',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertSame(0, ContactMessage::query()->count());
    }

    public function test_requests_pass_without_a_token_when_turnstile_is_disabled(): void
    {
        User::factory()->create([
            'email' => 'learner@example.com',
            'password' => 'Password123!',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'learner@example.com',
            'password' => 'Password123!',
        ])->assertOk();
    }

    public function test_registration_requires_a_turnstile_token_when_enabled(): void
    {
        $this->enableTurnstile();

        $this->postJson('/api/v1/auth/register', $this->registrationPayload())
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['turnstile_token']);

        $this->assertDatabaseMissing('users', [
            'email' => 'bot-test@example.com',
        ]);
    }

    public function test_valid_turnstile_token_allows_registration(): void
    {
        $this->enableTurnstile();

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => true]),
        ]);

        $this->postJson('/api/v1/auth/register', $this->registrationPayload([
            'turnstile_token' => 'human-token',
        ]))->assertCreated();

        Http::assertSent(fn ($request) => $request['secret'] === 'secret-key'
            && $request['response'] === 'human-token');

        $this->assertDatabaseHas('users', [
            'email' => 'bot-test@example.com',
        ]);
    }

    public function test_invalid_turnstile_token_is_rejected(): void
    {
        $this->enableTurnstile();

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response(['success' => false]),
        ]);

        $this->postJson('/api/v1/contact', $this->contactPayload([
            'turnstile_token' => 'bad-token',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['turnstile_token']);

        $this->assertSame(0, ContactMessage::query()->count());
    }

    public function test_a_turnstile_outage_fails_closed(): void
    {
        $this->enableTurnstile();

        Http::fake([
            'challenges.cloudflare.com/*' => Http::response('unavailable', 503),
        ]);

        $this->postJson('/api/v1/contact', $this->contactPayload([
            'turnstile_token' => 'human-token',
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['turnstile_token']);
    }

    public function test_public_config_exposes_the_site_key_but_not_the_secret(): void
    {
        $this->enableTurnstile();

        $response = $this->getJson('/api/v1/config/bot-protection')
            ->assertOk()
            ->assertJsonPath('data.enabled', true)
            ->assertJsonPath('data.site_key', 'site-key')
            ->assertJsonPath('data.honeypot_field', 'website');

        $this->assertStringNotContainsString(
            'secret-key',
            $response->getContent(),
        );
    }
}
