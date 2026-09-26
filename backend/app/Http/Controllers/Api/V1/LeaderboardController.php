<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Achievements\Models\UserAchievement;
use App\Domains\Progression\Models\StudentProgressionProfile;
use App\Domains\Progression\Services\StudentProgressionService;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function index(Request $request, StudentProgressionService $progression): JsonResponse
    {
        $limit = min(max((int) $request->integer('limit', 10), 1), 50);

        $profileModels = StudentProgressionProfile::query()
            ->with('user:id,first_name,last_name,username,avatar')
            ->orderByDesc('total_xp')
            ->orderBy('updated_at')
            ->limit($limit)
            ->get();

        $badgesByUser = $this->badgesFor($profileModels->pluck('user_id'));

        $profiles = $profileModels
            ->map(fn (StudentProgressionProfile $profile) => [
                'user_id' => $profile->user_id,
                'name' => $profile->user?->first_name ? trim($profile->user->first_name.' '.$profile->user->last_name) : ($profile->user?->username ?? 'Student'),
                'username' => $profile->user?->username,
                'avatar' => $profile->user?->avatar,
                'total_xp' => (int) ($profile->total_xp ?? 0),
                'level' => (int) ($profile->level ?? 1),
                'current_streak' => $progression->effectiveStreak($profile),
                'badges' => $badgesByUser[$profile->user_id] ?? [],
            ])
            ->values();

        $me = null;
        if ($request->user()) {
            $myProfile = StudentProgressionProfile::firstOrCreate(['user_id' => $request->user()->id]);
            $myTotalXp = (int) ($myProfile->total_xp ?? 0);
            $rank = StudentProgressionProfile::query()->where('total_xp', '>', $myTotalXp)->count() + 1;
            $user = $request->user();
            $me = [
                'user_id' => $myProfile->user_id,
                'name' => $user->first_name ? trim($user->first_name.' '.$user->last_name) : ($user->username ?? 'Student'),
                'username' => $user->username,
                'avatar' => $user->avatar,
                'total_xp' => $myTotalXp,
                'level' => $myProfile->level ?? 1,
                'rank' => $rank,
                'current_streak' => $progression->effectiveStreak($myProfile),
                'badges' => $this->badgesFor([$user->id])[$user->id] ?? [],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'top' => $profiles,
                'me' => $me,
            ],
        ]);
    }

    /**
     * Peer bonus XP: a small daily gift another student can send from the
     * achievements podium. One bonus per (giver, target, day).
     */
    public function bonus(Request $request, StudentProgressionService $progression): JsonResponse
    {
        $data = $request->validate([
            'target_user_id' => ['required', 'exists:users,id'],
        ]);

        $giver = $request->user();
        $targetId = (string) $data['target_user_id'];

        if ($targetId === (string) $giver->id) {
            return response()->json([
                'message' => 'You cannot send a bonus to yourself.',
                'errors' => ['target_user_id' => ['You cannot send a bonus to yourself.']],
            ], 422);
        }

        $target = User::query()->findOrFail($targetId);

        $transaction = $progression->award(
            $target,
            'peer_bonus',
            5,
            10,
            "peer-bonus:{$giver->id}:".now()->toDateString(),
            ['label' => 'Peer bonus XP', 'from' => $giver->id],
        );

        if ($transaction === null) {
            return response()->json([
                'success' => false,
                'message' => 'You already sent this student a bonus today.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'xp' => $transaction->xp,
        ]);
    }

    /**
     * Last badges earned per user (up to 3 each) for the podium popups.
     *
     * @return array<string, list<array{id: string, earned_at: string|null}>>
     */
    private function badgesFor(iterable $userIds): array
    {
        $ids = collect($userIds)->filter()->values();
        if ($ids->isEmpty()) {
            return [];
        }

        return UserAchievement::query()
            ->whereIn('user_id', $ids)
            ->orderByDesc('earned_at')
            ->orderByDesc('created_at')
            ->get(['user_id', 'badge', 'earned_at'])
            ->groupBy('user_id')
            ->map(fn ($rows) => $rows
                ->take(3)
                ->map(fn (UserAchievement $row): array => [
                    'id' => $row->badge,
                    'earned_at' => $row->earned_at?->toISOString(),
                ])
                ->values()
                ->all())
            ->all();
    }
}
