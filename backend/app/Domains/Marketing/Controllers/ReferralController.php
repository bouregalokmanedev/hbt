<?php

namespace App\Domains\Marketing\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

final class ReferralController extends Controller
{
    public function overview(): JsonResponse
    {
        $top = User::query()
            ->select('id', 'uuid', 'first_name', 'last_name', 'email', 'referral_code')
            ->withCount(['referrals' => fn ($query) => $query])
            ->orderByDesc('referrals_count')
            ->take(10)
            ->get()
            ->filter(fn (User $user) => $user->referrals_count > 0)
            ->values()
            ->map(fn (User $user) => [
                'name' => $user->full_name,
                'email' => $user->email,
                'code' => $user->referral_code,
                'invites' => $user->referrals_count,
            ]);

        return response()->json([
            'data' => [
                'total_referral_signups' => User::query()->whereNotNull('referred_by')->count(),
                'ambassadors' => User::query()->has('referrals', '>=', 3)->count(),
                'top' => $top,
            ],
        ]);
    }
}
