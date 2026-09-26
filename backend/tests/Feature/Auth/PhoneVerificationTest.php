<?php

namespace Tests\Feature\Auth;

use App\Models\OneTimePassword;
use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PhoneVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function tokenFor(User $user): string
    {
        return $user->createToken('auth_token')->plainTextToken;
    }

    public function test_send_requires_authentication(): void
    {
        $this->postJson('/api/v1/auth/phone/otp/send')
            ->assertUnauthorized();
    }

    public function test_send_rejects_users_without_a_phone_number(): void
    {
        $user = User::factory()->create(['phone' => null]);

        $this->withToken($this->tokenFor($user))
            ->postJson('/api/v1/auth/phone/otp/send')
            ->assertStatus(422);
    }

    public function test_send_creates_a_phone_verification_code_and_delivers_by_email_without_sms_credentials(): void
    {
        Notification::fake();

        $user = User::factory()->create(['phone' => '+213555000111', 'phone_verified_at' => null]);

        $response = $this->withToken($this->tokenFor($user))
            ->postJson('/api/v1/auth/phone/otp/send');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.delivery', 'email');

        $this->assertSame(1, OneTimePassword::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'phone_verification')
            ->count());

        Notification::assertSentTo($user, TwoFactorCodeNotification::class);
    }

    public function test_send_delivers_by_sms_when_twilio_is_configured(): void
    {
        Http::fake();
        config([
            'services.twilio.sid' => 'AC_test',
            'services.twilio.token' => 'token_test',
            'services.twilio.from' => '+10000000000',
        ]);

        $user = User::factory()->create(['phone' => '+213555000111', 'phone_verified_at' => null]);

        $this->withToken($this->tokenFor($user))
            ->postJson('/api/v1/auth/phone/otp/send')
            ->assertOk()
            ->assertJsonPath('data.delivery', 'sms');

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'api.twilio.com')
                && $request['To'] === '+213555000111';
        });
    }

    public function test_verify_marks_the_phone_as_verified(): void
    {
        Notification::fake();

        $user = User::factory()->create(['phone' => '+213555000111', 'phone_verified_at' => null]);
        $token = $this->tokenFor($user);

        $this->withToken($token)
            ->postJson('/api/v1/auth/phone/otp/send')
            ->assertOk();

        $code = null;
        Notification::assertSentTo($user, TwoFactorCodeNotification::class, function (TwoFactorCodeNotification $notification) use (&$code): bool {
            $code = $notification->code;

            return true;
        });

        $this->withToken($token)
            ->postJson('/api/v1/auth/phone/otp/verify', ['code' => $code])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertNotNull($this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->json('data.phone_verified_at'));
        $this->assertNotNull($user->fresh()->phone_verified_at);
    }

    public function test_verify_rejects_a_wrong_code_and_the_code_stays_single_use(): void
    {
        Notification::fake();

        $user = User::factory()->create(['phone' => '+213555000111', 'phone_verified_at' => null]);
        $token = $this->tokenFor($user);

        $this->withToken($token)
            ->postJson('/api/v1/auth/phone/otp/send')
            ->assertOk();

        $this->withToken($token)
            ->postJson('/api/v1/auth/phone/otp/verify', ['code' => '000000'])
            ->assertStatus(422);

        $code = null;
        Notification::assertSentTo($user, TwoFactorCodeNotification::class, function (TwoFactorCodeNotification $notification) use (&$code): bool {
            $code = $notification->code;

            return true;
        });

        $this->withToken($token)
            ->postJson('/api/v1/auth/phone/otp/verify', ['code' => $code])
            ->assertOk();

        // Same code cannot be replayed.
        $this->withToken($token)
            ->postJson('/api/v1/auth/phone/otp/verify', ['code' => $code])
            ->assertStatus(422);

        $this->assertNotNull($user->fresh()->phone_verified_at);
    }

    public function test_changing_the_phone_number_clears_the_verification(): void
    {
        $user = User::factory()->create([
            'phone' => '+213555000111',
            'phone_verified_at' => now(),
        ]);

        $this->withToken($this->tokenFor($user))
            ->putJson('/api/v1/auth/profile', [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'username' => $user->username,
                'phone' => '+213555999888',
            ])
            ->assertOk();

        $user->refresh();

        $this->assertNull($user->phone_verified_at);
        $this->assertSame('+213555999888', $user->phone);
    }

    public function test_resaving_the_same_phone_keeps_the_verification(): void
    {
        $user = User::factory()->create([
            'phone' => '+213555000111',
            'phone_verified_at' => now(),
        ]);

        $this->withToken($this->tokenFor($user))
            ->putJson('/api/v1/auth/profile', [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'username' => $user->username,
                'phone' => '+213555000111',
            ])
            ->assertOk();

        $this->assertNotNull($user->fresh()->phone_verified_at);
    }

    public function test_me_returns_the_phone_verification_state(): void
    {
        $user = User::factory()->create([
            'phone' => '+213555000111',
            'phone_verified_at' => now(),
        ]);

        $response = $this->withToken($this->tokenFor($user))
            ->getJson('/api/v1/auth/me');

        $response
            ->assertOk()
            ->assertJsonPath('data.phone', '+213555000111');

        $this->assertNotNull($response->json('data.phone_verified_at'));
    }
}
