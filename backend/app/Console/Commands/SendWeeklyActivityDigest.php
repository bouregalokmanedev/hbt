<?php

namespace App\Console\Commands;

use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Progression\Models\StudentXpTransaction;
use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendWeeklyActivityDigest extends Command
{
    protected $signature = 'notifications:weekly-digest';

    protected $description = 'Email active students a personalized weekly learning activity summary.';

    public function handle(StudentNotificationService $notifications): int
    {
        $weekStart = now()->startOfWeek();
        $weekEnd = now()->endOfWeek();

        $activeUserIds = StudentXpTransaction::query()
            ->whereBetween('created_at', [$weekStart, $weekEnd])
            ->whereIn('event', [
                'lesson_completed',
                'quiz_passed',
                'assessment_passed',
                'simulator_completed',
                'diagnostic_completed',
                'course_enrolled',
                'section_completed',
            ])
            ->distinct()
            ->pluck('user_id');

        if ($activeUserIds->isEmpty()) {
            $this->info('No active learners this week.');

            return self::SUCCESS;
        }

        $users = User::query()
            ->whereIn('id', $activeUserIds)
            ->where('status', 'active')
            ->whereHas('roles', fn ($roles) => $roles->where('name', UserRole::STUDENT->value))
            ->with('studentNotificationSetting')
            ->get();

        $sent = 0;

        foreach ($users as $user) {
            $stats = DB::table('student_xp_transactions')
                ->where('user_id', $user->id)
                ->whereBetween('created_at', [$weekStart, $weekEnd])
                ->selectRaw('COUNT(*) as actions, COALESCE(SUM(xp), 0) as xp')
                ->first();

            if ($stats === null || (int) $stats->actions < 1) {
                continue;
            }

            $name = trim((string) ($user->first_name ?? ''));
            $greeting = $name !== '' ? "Hi {$name}," : 'Hello,';
            $xp = (int) $stats->xp;
            $actions = (int) $stats->actions;

            $delivered = $notifications->send(
                $user,
                'weekly_activity',
                'Your weekly learning recap',
                "{$greeting} you completed {$actions} learning ".($actions === 1 ? 'action' : 'actions')." and earned {$xp} XP this week on HBT Learning. We love showing up for you — ready for another strong week?",
                '/dashboard',
                'weekly-digest:'.$weekStart->toDateString(),
            );

            if ($delivered) {
                $sent++;
            }
        }

        $this->info("Weekly digest delivered to {$sent} learner(s).");

        return self::SUCCESS;
    }
}
