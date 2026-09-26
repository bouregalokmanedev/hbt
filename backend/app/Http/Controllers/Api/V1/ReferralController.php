<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Progression\Models\StudentXpTransaction;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\ReferralCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReferralController extends Controller
{
    /**
     * Return (and lazily mint) the learner's invite code plus simple funnel
     * stats, so the dashboard "Invite friends" card has one round trip.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($user): void {
            if (! $user->referral_code) {
                $user->forceFill([
                    'referral_code' => ReferralCode::generate(),
                ])->save();
            }
        });

        $user->refresh();

        $invites = User::query()->where('referred_by', $user->id)->count();

        $xpEarned = (int) StudentXpTransaction::query()
            ->where('user_id', $user->id)
            ->where('event', 'referral_signup')
            ->sum('xp');

        return response()->json([
            'data' => [
                'code' => $user->referral_code,
                'invites' => $invites,
                'xp_earned' => $xpEarned,
                'reward_xp' => 25,
            ],
        ]);
    }
}
