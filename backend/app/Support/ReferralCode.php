<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Support\Str;

final class ReferralCode
{
    /**
     * Human-shoutable invite code (8 uppercase chars, URL safe).
     * Regenerated on collision so the unique index always holds.
     */
    public static function generate(): string
    {
        do {
            $code = Str::upper(Str::random(8));
        } while (User::withTrashed()->where('referral_code', $code)->exists());

        return $code;
    }
}
