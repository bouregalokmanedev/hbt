<?php

namespace App\Services\Security;

use App\Models\User;
use App\Models\OneTimePassword;

class OtpService
{
    public function generate(
        User $user,
        string $purpose
    ): OneTimePassword {

        return OneTimePassword::create([

            'user_id'=>$user->id,

            'purpose'=>$purpose,

            'code'=>(string) random_int(100000,999999),

            'expires_at'=>now()->addMinutes(10),

        ]);

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

        if (! $otp)
            return false;

        if ($otp->verified_at)
            return false;

        if ($otp->expires_at->isPast())
            return false;

        $otp->increment('attempts');

        if ($otp->attempts > 5)
            return false;

        if ($otp->code !== $code)
            return false;

        $otp->update([

            'verified_at'=>now()

        ]);

        return true;

    }
}