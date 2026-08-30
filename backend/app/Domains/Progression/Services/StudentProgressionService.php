<?php

namespace App\Domains\Progression\Services;

use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Progression\Models\StudentProgressionProfile;
use App\Domains\Progression\Models\StudentXpTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StudentProgressionService
{
    /** Total XP required to enter each level. */
    private const LEVELS = [
        1 => ['title' => 'Foundation', 'threshold' => 0],
        2 => ['title' => 'Explorer', 'threshold' => 100],
        3 => ['title' => 'Apprentice', 'threshold' => 250],
        4 => ['title' => 'Technician', 'threshold' => 500],
        5 => ['title' => 'Specialist', 'threshold' => 900],
        6 => ['title' => 'Expert', 'threshold' => 1400],
        7 => ['title' => 'Master', 'threshold' => 2100],
    ];

    public function award(User $user, string $event, int $minimum, int $maximum, string $dedupeKey, array $metadata = []): ?StudentXpTransaction
    {
        return DB::transaction(function () use ($user, $event, $minimum, $maximum, $dedupeKey, $metadata) {
            if (StudentXpTransaction::where('user_id', $user->id)->where('dedupe_key', $dedupeKey)->exists()) return null;
            $profile = StudentProgressionProfile::firstOrCreate(['user_id' => $user->id]);
            $previousLevel = $profile->level;
            $previousStreak = (int) ($profile->current_streak ?? 0);
            $transaction = StudentXpTransaction::create([
                'user_id' => $user->id, 'event' => $event, 'xp' => random_int($minimum, $maximum),
                'dedupe_key' => $dedupeKey, 'metadata' => $metadata,
            ]);
            $profile->total_xp += $transaction->xp;
            $this->recordLearningDay($profile);
            if ($profile->current_streak >= 3 && ! StudentXpTransaction::where('user_id', $user->id)->where('dedupe_key', 'streak-day:'.$profile->last_activity_date->toDateString())->exists()) {
                [$bonusMinimum, $bonusMaximum] = match (true) {
                    $profile->current_streak >= 14 => [20, 30],
                    $profile->current_streak >= 7 => [12, 18],
                    default => [5, 10],
                };
                $bonus = StudentXpTransaction::create([
                    'user_id' => $user->id, 'event' => 'streak_bonus', 'xp' => random_int($bonusMinimum, $bonusMaximum),
                    'dedupe_key' => 'streak-day:'.$profile->last_activity_date->toDateString(),
                    'metadata' => ['label' => 'Learning streak bonus', 'streak' => $profile->current_streak],
                ]);
                $profile->total_xp += $bonus->xp;
            }
            $profile->level = $this->levelFor($profile->total_xp);
            $profile->save();
            if ($profile->current_streak > $previousStreak && $profile->current_streak > 1) {
                app(StudentNotificationService::class)->send($user, 'learning_streak', 'Streak extended!', "You are on a {$profile->current_streak}-day learning streak.", '/achievements', 'streak:'.$profile->last_activity_date->toDateString());
            }
            if ($profile->level > $previousLevel) {
                $level = self::LEVELS[$profile->level];
                app(StudentNotificationService::class)->send($user, 'level_up', 'Level up!', "You reached level {$profile->level}: {$level['title']}.", '/achievements', "level:{$profile->level}");
            }
            return $transaction;
        });
    }

    public function summaryFor(User $user): array
    {
        $profile = StudentProgressionProfile::firstOrCreate(['user_id' => $user->id]);
        $level = self::LEVELS[$profile->level] ?? end(self::LEVELS);
        $next = self::LEVELS[$profile->level + 1] ?? null;
        $start = $level['threshold'];
        $progress = $next ? (int) min(100, round((($profile->total_xp - $start) / max(1, $next['threshold'] - $start)) * 100)) : 100;
        $activeDays = StudentXpTransaction::where('user_id', $user->id)
            ->where('created_at', '>=', now()->startOfDay()->subDays(6))
            ->get(['created_at'])
            ->map(fn (StudentXpTransaction $transaction) => $transaction->created_at->toDateString())
            ->unique()
            ->values();
        $learningDays = collect(range(6, 0))->map(fn (int $daysAgo) => [
            'date' => now()->startOfDay()->subDays($daysAgo)->toDateString(),
            'active' => $activeDays->contains(now()->startOfDay()->subDays($daysAgo)->toDateString()),
        ])->values()->all();
        return [
            'total_xp' => $profile->total_xp, 'level' => $profile->level, 'title' => $level['title'],
            'next_level_xp' => $next['threshold'] ?? $profile->total_xp, 'next_level_title' => $next['title'] ?? 'Maximum level',
            'progress_percent' => $progress,
            'current_streak' => (int) ($profile->current_streak ?? 0),
            'longest_streak' => (int) ($profile->longest_streak ?? 0),
            'last_activity_date' => optional($profile->last_activity_date)->toDateString(),
            'learning_days' => $learningDays,
            'recent_awards' => StudentXpTransaction::where('user_id', $user->id)->latest()->take(6)->get(['id', 'event', 'xp', 'metadata', 'created_at']),
        ];
    }

    private function recordLearningDay(StudentProgressionProfile $profile): void
    {
        $today = now()->startOfDay();
        $last = $profile->last_activity_date?->startOfDay();
        if ($last?->equalTo($today)) return;

        $profile->current_streak = $last?->diffInDays($today) === 1 ? $profile->current_streak + 1 : 1;
        $profile->longest_streak = max($profile->longest_streak, $profile->current_streak);
        $profile->last_activity_date = $today;
    }

    private function levelFor(int $xp): int
    {
        return collect(self::LEVELS)->filter(fn ($level) => $xp >= $level['threshold'])->keys()->max() ?? 1;
    }

    public static function badgeXp(string $badge): int { return match ($badge) { 'learner' => 70, 'elite' => 55, 'striker' => 40, 'owner' => 35, 'pro' => 50, 'member' => 10, default => 25 }; }
}
