<?php

namespace App\Services\Security;

use App\Models\User;
use App\Models\OneTimePassword;
use Illuminate\Support\Facades\Hash;

class OtpService
{
    /**
     * Create a one-time code. The plaintext is returned once for delivery;
     * only a hash is persisted.
     *
     * @return array{record: OneTimePassword, code: string}
     */
    public function generate(
        User $user,
        string $purpose
    ): array {
        $plain = (string) random_int(100000, 999999);

        $record = OneTimePassword::create([
            'user_id' => $user->id,
            'purpose' => $purpose,
            'code' => Hash::make($plain),
            'expires_at' => now()->addMinutes(10),
        ]);

        return [
            'record' => $record,
            'code' => $plain,
        ];
    }

    public function verify(
        User $user,
        string $purpose,
        string $code
    ): bool {
        $otp = OneTimePassword::query()
            ->whereUserId($user->id)
            ->wherePurpose($purpose)
            ->latest()
            ->first();

        if (! $otp) {
            return false;
        }

        if ($otp->verified_at) {
            return false;
        }

        if ($otp->expires_at->isPast()) {
            return false;
        }

        if ($otp->attempts >= 5) {
            return false;
        }

        $otp->increment('attempts');

        if (! Hash::check($code, $otp->code)) {
            return false;
        }

        $otp->update([
            'verified_at' => now(),
        ]);

        return true;
    }
}
