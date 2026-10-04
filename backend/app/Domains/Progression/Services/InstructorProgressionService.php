<?php

namespace App\Domains\Progression\Services;

use App\Domains\Progression\Models\InstructorProgressionProfile;
use App\Domains\Progression\Models\InstructorXpTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Instructor XP and levels. Deliberately separate from the student
 * progression tables so teaching never inflates a learner's leaderboard
 * position (and vice versa).
 */
class InstructorProgressionService
{
    /** Total XP required to enter each level. */
    private const LEVELS = [
        1 => ['title' => 'Contributor', 'threshold' => 0],
        2 => ['title' => 'Facilitator', 'threshold' => 150],
        3 => ['title' => 'Mentor', 'threshold' => 400],
        4 => ['title' => 'Lead Instructor', 'threshold' => 800],
        5 => ['title' => 'Curriculum Expert', 'threshold' => 1400],
        6 => ['title' => 'Master Instructor', 'threshold' => 2200],
        7 => ['title' => 'Academy Legend', 'threshold' => 3200],
    ];

    /**
     * Events that count as real teaching activity for streak purposes.
     * Derived rewards are never listed here so a re-render can't fabricate
     * a teaching day.
     */
    private const TEACHING_EVENTS = [
        'course_published',
        'lesson_published',
        'assessment_graded',
        'student_enrolled',
        'student_completed_course',
    ];

    /**
     * Award a ranged amount of XP for an instructor action. The dedupe key
     * makes the award idempotent — the same course can only be published once,
     * the same attempt only graded once, and so on.
     *
     * @return InstructorXpTransaction|null null when the award was already claimed
     */
    public function award(
        User $instructor,
        string $event,
        int $minimum,
        int $maximum,
        string $dedupeKey,
        array $metadata = []
    ): ?InstructorXpTransaction {
        return DB::transaction(function () use ($instructor, $event, $minimum, $maximum, $dedupeKey, $metadata) {
            $alreadyClaimed = InstructorXpTransaction::where('user_id', $instructor->id)
                ->where('dedupe_key', $dedupeKey)
                ->exists();

            if ($alreadyClaimed) {
                return null;
            }

            $profile = InstructorProgressionProfile::firstOrCreate(
                ['user_id' => $instructor->id],
                ['total_xp' => 0, 'level' => 1, 'current_streak' => 0, 'longest_streak' => 0],
            );

            $transaction = InstructorXpTransaction::create([
                'user_id' => $instructor->id,
                'event' => $event,
                'xp' => random_int($minimum, $maximum),
                'dedupe_key' => $dedupeKey,
                'metadata' => $metadata,
            ]);

            $profile->total_xp += $transaction->xp;
            $this->recordTeachingDay($profile);
            $profile->level = $this->levelFor($profile->total_xp);
            $profile->save();

            return $transaction;
        });
    }

    public function summaryFor(User $instructor): array
    {
        $profile = InstructorProgressionProfile::firstOrCreate(
            ['user_id' => $instructor->id],
            ['total_xp' => 0, 'level' => 1, 'current_streak' => 0, 'longest_streak' => 0],
        );

        $totalXp = (int) $profile->total_xp;
        $levelNumber = max(1, (int) ($profile->level ?? 1));
        $levels = self::LEVELS;
        $level = $levels[$levelNumber] ?? $levels[1];
        $next = $levels[$levelNumber + 1] ?? null;

        $start = $level['threshold'];
        $progress = $next
            ? (int) min(100, round((($totalXp - $start) / max(1, $next['threshold'] - $start)) * 100))
            : 100;

        $activeDays = InstructorXpTransaction::where('user_id', $instructor->id)
            ->whereIn('event', self::TEACHING_EVENTS)
            ->where('created_at', '>=', now()->startOfDay()->subDays(6))
            ->get(['created_at'])
            ->map(fn (InstructorXpTransaction $transaction) => $transaction->created_at->toDateString())
            ->unique()
            ->values();

        $teachingDays = collect(range(6, 0))->map(fn (int $daysAgo) => [
            'date' => now()->startOfDay()->subDays($daysAgo)->toDateString(),
            'active' => $activeDays->contains(now()->startOfDay()->subDays($daysAgo)->toDateString()),
        ])->values()->all();

        return [
            'total_xp' => $totalXp,
            'level' => $levelNumber,
            'title' => $level['title'],
            'next_level_xp' => $next['threshold'] ?? $totalXp,
            'next_level_title' => $next['title'] ?? 'Maximum level',
            'progress_percent' => $progress,
            'current_streak' => $this->effectiveStreak($profile),
            'longest_streak' => (int) ($profile->longest_streak ?? 0),
            'last_activity_date' => optional($profile->last_activity_date)->toDateString(),
            'teaching_days' => $teachingDays,
            'recent_awards' => InstructorXpTransaction::where('user_id', $instructor->id)
                ->latest()
                ->take(6)
                ->get(['id', 'event', 'xp', 'metadata', 'created_at']),
        ];
    }

    /**
     * Display-safe streak: it survives until the end of the day after the
     * last activity. Once two or more calendar days pass without teaching the
     * stored count is stale — report 0 until the next award restarts it.
     */
    public function effectiveStreak(InstructorProgressionProfile $profile): int
    {
        $last = $profile->last_activity_date?->startOfDay();

        if ($last === null) {
            return 0;
        }

        $gap = (int) $last->diffInDays(now()->startOfDay());

        return $gap <= 1 ? (int) ($profile->current_streak ?? 0) : 0;
    }

    private function recordTeachingDay(InstructorProgressionProfile $profile): void
    {
        $today = now()->startOfDay();
        $last = $profile->last_activity_date?->startOfDay();

        if ($last?->equalTo($today)) {
            return;
        }

        $previous = (int) ($profile->current_streak ?? 0);
        $gap = $last === null ? null : (int) $last->diffInDays($today);

        $profile->current_streak = $gap === 1 ? $previous + 1 : 1;
        $profile->longest_streak = max((int) ($profile->longest_streak ?? 0), $previous, $profile->current_streak);
        $profile->last_activity_date = $today;
    }

    private function levelFor(int $xp): int
    {
        return collect(self::LEVELS)
            ->filter(fn (array $level) => $xp >= $level['threshold'])
            ->keys()
            ->max() ?? 1;
    }
}
