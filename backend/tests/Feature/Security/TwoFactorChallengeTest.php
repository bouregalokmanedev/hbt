<?php

use App\Domains\Students\Models\StudentSecuritySetting;
use App\Models\TwoFactorChallenge;
use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function enableEmailTwoFactor(User $user): void
{
    StudentSecuritySetting::updateOrCreate(
        ['user_id' => $user->id],
        [
            'two_factor_enabled' => true,
            'two_factor_method' => 'email',
            'two_factor_verified_at' => now(),
        ],
    );
}

/**
 * Complete the password step and return the challenge token plus the code
 * that was delivered by email.
 *
 * @return array{token: string, code: string}
 */
function startTwoFactorChallenge(User $user): array
{
    $response = test()->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertStatus(423)
        ->assertJsonPath('requires_two_factor', true);

    $code = null;

    Notification::assertSentTo(
        $user,
        TwoFactorCodeNotification::class,
        function (TwoFactorCodeNotification $notification) use (&$code): bool {
            $code = $notification->code;

            return true;
        },
    );

    expect($code)->toBeString()->toHaveLength(6);

    return [
        'token' => (string) $response->json('challenge_token'),
        'code' => (string) $code,
    ];
}

beforeEach(function () {
    Notification::fake();
});

it('issues a challenge token with the 423 response after a correct password', function () {
    $user = User::factory()->create();
    enableEmailTwoFactor($user);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertStatus(423)
        ->assertJsonPath('requires_two_factor', true)
        ->assertJsonPath('expires_in', TwoFactorChallenge::TTL_MINUTES * 60);

    expect($response->json('challenge_token'))->toBeString()->toHaveLength(64);

    $this->assertDatabaseHas('two_factor_challenges', [
        'user_id' => $user->id,
        'consumed_at' => null,
    ]);

    // Only the hash is stored, never the token itself.
    $challenge = TwoFactorChallenge::where('user_id', $user->id)->firstOrFail();
    expect($challenge->token_hash)->toHaveLength(64)
        ->and($challenge->token_hash)->not->toBe($response->json('challenge_token'));
});

it('completes login with a valid challenge token and otp', function () {
    $user = User::factory()->create();
    enableEmailTwoFactor($user);

    $challenge = startTwoFactorChallenge($user);

    $response = $this->postJson('/api/v1/auth/two-factor/login/verify', [
        'email' => $user->email,
        'code' => $challenge['code'],
        'challenge_token' => $challenge['token'],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.user.email', $user->email);

    $token = $response->json('data.token');

    $this->withToken($token)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.email', $user->email);

    $this->assertDatabaseMissing('two_factor_challenges', [
        'user_id' => $user->id,
        'consumed_at' => null,
    ]);
});

it('rejects an otp that arrives without the challenge token', function () {
    $user = User::factory()->create();
    enableEmailTwoFactor($user);

    $challenge = startTwoFactorChallenge($user);

    // Knowing the mailbox code alone must never mint an API token.
    $this->postJson('/api/v1/auth/two-factor/login/verify', [
        'email' => $user->email,
        'code' => $challenge['code'],
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['challenge_token']);
});

it('rejects a challenge token issued for another account', function () {
    $victim = User::factory()->create();
    $attacker = User::factory()->create();
    enableEmailTwoFactor($victim);
    enableEmailTwoFactor($attacker);

    $victimChallenge = startTwoFactorChallenge($victim);
    $attackerChallenge = startTwoFactorChallenge($attacker);

    $this->postJson('/api/v1/auth/two-factor/login/verify', [
        'email' => $victim->email,
        'code' => $victimChallenge['code'],
        'challenge_token' => $attackerChallenge['token'],
    ])->assertUnprocessable()
        ->assertJsonPath('message', 'Your verification session has expired. Please sign in again.');
});

it('allows a challenge to be used only once', function () {
    $user = User::factory()->create();
    enableEmailTwoFactor($user);

    $challenge = startTwoFactorChallenge($user);

    $payload = [
        'email' => $user->email,
        'code' => $challenge['code'],
        'challenge_token' => $challenge['token'],
    ];

    $this->postJson('/api/v1/auth/two-factor/login/verify', $payload)->assertOk();

    $this->postJson('/api/v1/auth/two-factor/login/verify', $payload)
        ->assertStatus(422);
});

it('rejects an expired challenge', function () {
    $user = User::factory()->create();
    enableEmailTwoFactor($user);

    $challenge = startTwoFactorChallenge($user);

    TwoFactorChallenge::query()
        ->where('user_id', $user->id)
        ->update(['expires_at' => now()->subMinute()]);

    $this->postJson('/api/v1/auth/two-factor/login/verify', [
        'email' => $user->email,
        'code' => $challenge['code'],
        'challenge_token' => $challenge['token'],
    ])->assertStatus(422)
        ->assertJsonPath('message', 'Your verification session has expired. Please sign in again.');
});

it('rejects completion when the account is suspended after the challenge was issued', function () {
    $user = User::factory()->create();
    enableEmailTwoFactor($user);

    $challenge = startTwoFactorChallenge($user);

    $user->update(['status' => 'suspended']);

    $this->postJson('/api/v1/auth/two-factor/login/verify', [
        'email' => $user->email,
        'code' => $challenge['code'],
        'challenge_token' => $challenge['token'],
    ])->assertStatus(422);
});

it('rejects completion when two-factor was disabled after the challenge was issued', function () {
    $user = User::factory()->create();
    enableEmailTwoFactor($user);

    $challenge = startTwoFactorChallenge($user);

    StudentSecuritySetting::where('user_id', $user->id)
        ->update(['two_factor_enabled' => false]);

    $this->postJson('/api/v1/auth/two-factor/login/verify', [
        'email' => $user->email,
        'code' => $challenge['code'],
        'challenge_token' => $challenge['token'],
    ])->assertStatus(422);
});

it('requires the challenge token to resend a code and invalidates the previous code', function () {
    $user = User::factory()->create();
    enableEmailTwoFactor($user);

    $challenge = startTwoFactorChallenge($user);

    $this->postJson('/api/v1/auth/two-factor/login/resend', [
        'email' => $user->email,
    ])->assertUnprocessable()
        ->assertJsonValidationErrors(['challenge_token']);

    $this->postJson('/api/v1/auth/two-factor/login/resend', [
        'email' => $user->email,
        'challenge_token' => $challenge['token'],
    ])->assertOk()
        ->assertJsonPath('data.resent', true);

    $codes = [];
    Notification::assertSentTo(
        $user,
        TwoFactorCodeNotification::class,
        function (TwoFactorCodeNotification $notification) use (&$codes): bool {
            $codes[] = $notification->code;

            return true;
        },
    );

    expect($codes)->toHaveCount(2)
        ->and($codes[1])->not->toBe($codes[0]);

    // The superseded code no longer works...
    $this->postJson('/api/v1/auth/two-factor/login/verify', [
        'email' => $user->email,
        'code' => $challenge['code'],
        'challenge_token' => $challenge['token'],
    ])->assertStatus(422);

    // ...but the reissued one does.
    $this->postJson('/api/v1/auth/two-factor/login/verify', [
        'email' => $user->email,
        'code' => $codes[1],
        'challenge_token' => $challenge['token'],
    ])->assertOk();
});

it('exhausts a challenge after five incorrect codes', function () {
    $user = User::factory()->create();
    enableEmailTwoFactor($user);

    $challenge = startTwoFactorChallenge($user);

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $this->postJson('/api/v1/auth/two-factor/login/verify', [
            'email' => $user->email,
            'code' => '000000',
            'challenge_token' => $challenge['token'],
        ])->assertStatus(422);
    }

    $record = TwoFactorChallenge::where('user_id', $user->id)->firstOrFail();

    expect($record->attempts)->toBe(5)
        ->and($record->isActive())->toBeFalse();
});
