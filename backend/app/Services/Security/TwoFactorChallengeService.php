<?php

namespace App\Services\Security;

use App\Models\TwoFactorChallenge;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Server-side proof that the password step completed before an OTP is
 * accepted.
 *
 * A six-digit code on its own is not a second factor: it is delivered to
 * the same mailbox the account is keyed by, and an endpoint that mints a
 * token from `email + code` alone can be replayed by anyone who obtains
 * the code. The challenge token is issued only after a successful
 * password check, is stored hashed, expires after ten minutes, and is
 * consumed atomically on first use.
 */
final class TwoFactorChallengeService
{
    /**
     * @return array{token: string, challenge: TwoFactorChallenge}
     */
    public function issue(User $user, ?Request $request = null): array
    {
        // One live challenge per account: starting a new login invalidates
        // any challenge that has not been completed yet.
        TwoFactorChallenge::query()
            ->where('user_id', $user->id)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);

        $token = Str::random(64);

        $challenge = TwoFactorChallenge::create([
            'user_id' => $user->id,
            'token_hash' => $this->hash($token),
            'ip_address' => $request?->ip(),
            'user_agent' => Str::limit((string) $request?->userAgent(), 500, ''),
            'expires_at' => now()->addMinutes(TwoFactorChallenge::TTL_MINUTES),
        ]);

        return [
            'token' => $token,
            'challenge' => $challenge,
        ];
    }

    public function findActiveFor(User $user, string $token): ?TwoFactorChallenge
    {
        if ($token === '') {
            return null;
        }

        return TwoFactorChallenge::query()
            ->where('user_id', $user->id)
            ->where('token_hash', $this->hash($token))
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->where('attempts', '<', TwoFactorChallenge::MAX_ATTEMPTS)
            ->first();
    }

    /**
     * Re-check the challenge under a row lock. Must be called from inside a
     * transaction so two concurrent verifies cannot both succeed.
     */
    public function lockActive(TwoFactorChallenge $challenge): ?TwoFactorChallenge
    {
        $locked = TwoFactorChallenge::query()
            ->whereKey($challenge->getKey())
            ->lockForUpdate()
            ->first();

        return $locked?->isActive() ? $locked : null;
    }

    public function recordFailure(TwoFactorChallenge $challenge): void
    {
        TwoFactorChallenge::query()
            ->whereKey($challenge->getKey())
            ->increment('attempts');
    }

    public function consume(TwoFactorChallenge $challenge): bool
    {
        return TwoFactorChallenge::query()
            ->whereKey($challenge->getKey())
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]) === 1;
    }

    private function hash(string $token): string
    {
        return hash('sha256', $token);
    }
}
