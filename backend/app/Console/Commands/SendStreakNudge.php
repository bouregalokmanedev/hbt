<?php

namespace App\Console\Commands;

use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Progression\Models\StudentProgressionProfile;
use Illuminate\Console\Command;

class SendStreakNudge extends Command
{
    protected $signature = 'notifications:streak-nudge';

    protected $description = 'Warn learners whose learning streak is about to break at midnight.';

    public function handle(StudentNotificationService $notifications): int
    {
        // A streak dies at the end of today when the last active day was
        // yesterday: one learning action before midnight keeps it alive.
        $lastActiveDay = now()->subDay()->toDateString();

        $profiles = StudentProgressionProfile::query()
            ->whereDate('last_activity_date', $lastActiveDay)
            ->where('current_streak', '>=', 3)
            ->with('user')
            ->get();

        $sent = 0;

        foreach ($profiles as $profile) {
            $user = $profile->user;

            if (! $user || $user->status !== 'active') {
                continue;
            }

            $streak = (int) $profile->current_streak;

            $delivered = $notifications->send(
                $user,
                'streak_nudge',
                "Your {$streak}-day streak is at risk",
                "You have learned {$streak} ".($streak === 1 ? 'day' : 'days').' in a row. One lesson today keeps the streak alive before midnight.',
                '/dashboard',
                'streak-nudge:'.$lastActiveDay,
            );

            if ($delivered) {
                $sent++;
            }
        }

        $this->info("Streak nudge delivered to {$sent} learner(s).");

        return self::SUCCESS;
    }
}
