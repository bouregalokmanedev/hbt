<?php

namespace App\Services\Security;

use App\Models\User;
use App\Models\OneTimePassword;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class OtpService
{
    /**
     * Create a one-time code. The plaintext is returned once for delivery;
     * only a hash is persisted.
     *
     * Any earlier unused code for the same purpose is expired so exactly
     * one code can ever be valid at a time.
     *
     * @return array{record: OneTimePassword, code: string}
     */
    public function generate(
        User $user,
        string $purpose
    ): array {
        $plain = (string) random_int(100000, 999999);

        $record = DB::transaction(function () use ($user, $purpose, $plain) {
            OneTimePassword::query()
                ->where('user_id', $user->id)
                ->where('purpose', $purpose)
                ->whereNull('verified_at')
                ->update(['expires_at' => now()]);

            return OneTimePassword::create([
                'user_id' => $user->id,
                'purpose' => $purpose,
                'code' => Hash::make($plain),
                'expires_at' => now()->addMinutes(10),
            ]);
        });

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
        return DB::transaction(function () use ($user, $purpose, $code) {
            /*
             * Lock the row so two concurrent requests cannot both consume
             * the same code (or both bypass the attempt limit).
             */
            $otp = OneTimePassword::query()
                ->whereUserId($user->id)
                ->wherePurpose($purpose)
                ->whereNull('verified_at')
                ->where('expires_at', '>', now())
                ->latest('created_at')
                ->lockForUpdate()
                ->first();

            if (! $otp) {
                return false;
            }

            if ($otp->attempts >= 5) {
                return false;
            }

            $otp->increment('attempts');

            if (! Hash::check($code, $otp->code)) {
                return false;
            }

            // Claim atomically so two concurrent requests cannot both pass.
            return OneTimePassword::query()
                ->whereKey($otp->getKey())
                ->whereNull('verified_at')
                ->update(['verified_at' => now()]) === 1;
        });
    }
}
