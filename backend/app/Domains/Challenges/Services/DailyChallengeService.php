<?php

namespace App\Domains\Challenges\Services;

use App\Domains\Challenges\Models\DailyChallengeAssignment;
use App\Domains\Challenges\Models\DailyChallengeDef;
use App\Domains\Challenges\Models\DailyChallengeRival;
use App\Domains\Progression\Services\StudentProgressionService;
use App\Models\User;
use Carbon\CarbonImmutable;

/**
 * Daily challenge board driven by real LMS / diagnostics / simulator actions.
 * Race ranking uses completed_at so peers can see who finished first.
 */
class DailyChallengeService
{
    public function __construct(private readonly StudentProgressionService $progression) {}

    /** Actions that can bump a challenge (wired at completion funnels). */
    public const ACTIONS = [
        'lesson_complete',
        'section_complete',
        'quiz_complete',
        'diagnostic_complete',
        'simulator_complete',
    ];

    public function todayFor(User $user): array
    {
        $date = CarbonImmutable::today();
        $defs = DailyChallengeDef::query()
            ->where('is_active', true)
            ->orderBy('sort')
            ->orderBy('id')
            ->get();

        $assignments = DailyChallengeAssignment::query()
            ->where('user_id', $user->id)
            ->whereDate('date', $date)
            ->get()
            ->keyBy('daily_challenge_def_id');

        $challenges = $defs->map(function (DailyChallengeDef $def) use ($assignments, $user, $date) {
            $row = $assignments->get($def->id);
            if (!$row) {
                $row = $this->findOrCreateAssignment($user, $def, $date);
            }

            return $this->presentChallenge($def, $row);
        })->values()->all();

        $done = collect($challenges)->filter(fn ($c) => in_array($c['status'], ['completed', 'claimed'], true))->count();

        return [
            'date' => $date->toDateString(),
            'challenges' => $challenges,
            'summary' => [
                'total' => count($challenges),
                'done' => $done,
                'xp_available' => (int) collect($challenges)->sum('xp'),
                'xp_claimed' => (int) collect($challenges)->where('status', 'claimed')->sum('xp'),
            ],
        ];
    }

    /**
     * Bump progress for a real action. Safe to call from any completion funnel.
     * $detail is optional shared payload (score, tool, title…) for peer share.
     */
    public function trackAction(User $user, string $action, array $detail = [], int $step = 1): void
    {
        if (!in_array($action, self::ACTIONS, true)) {
            return;
        }

        try {
            $date = CarbonImmutable::today();

            foreach (DailyChallengeDef::query()->where('is_active', true)->where('action', $action)->get() as $def) {
                $row = $this->findOrCreateAssignment($user, $def, $date);
                if ($row->status === 'claimed') {
                    continue;
                }

                $prev = (int) $row->progress;
                $next = min((int) $row->target, $prev + max(1, $step));
                $row->progress = $next;
                $row->detail = array_merge($row->detail ?? [], $detail);
                $row->status = $next >= (int) $row->target ? 'completed' : 'in_progress';
                if ($row->status === 'completed' && $row->completed_at === null) {
                    $row->completed_at = now();
                }
                $row->save();
            }
        } catch (\Throwable) {
            // Never fail the parent completion because challenge tables lag.
        }
    }

    public function claim(User $user, string $assignmentId): ?array
    {
        $row = DailyChallengeAssignment::query()
            ->with('def')
            ->where('user_id', $user->id)
            ->where('id', $assignmentId)
            ->first();

        if (!$row || !$row->def) {
            return null;
        }
        if ($row->status !== 'completed') {
            throw new \RuntimeException('Challenge not complete yet.');
        }

        if ($row->status !== 'claimed') {
            $this->progression->award(
                $user,
                'daily_challenge',
                (int) $row->def->xp,
                (int) $row->def->xp,
                'challenge:'.$row->id,
                ['title' => $row->def->title, 'date' => $row->date?->toDateString()],
            );
            $row->status = 'claimed';
            $row->xp_awarded = (int) $row->def->xp;
            $row->save();
        }

        return $this->presentChallenge($row->def, $row);
    }

    /** Review: yesterday's board for the signed-in student. */
    public function review(User $user): array
    {
        $date = CarbonImmutable::yesterday();
        $rows = DailyChallengeAssignment::query()
            ->with('def')
            ->where('user_id', $user->id)
            ->whereDate('date', $date)
            ->get();

        $challenges = $rows->map(fn ($row) => $row->def ? $this->presentChallenge($row->def, $row) : null)
            ->filter()
            ->values()
            ->all();

        $done = collect($challenges)->filter(fn ($c) => in_array($c['status'], ['completed', 'claimed'], true))->count();

        return [
            'date' => $date->toDateString(),
            'challenges' => $challenges,
            'summary' => [
                'total' => count($challenges),
                'done' => $done,
                'xp_claimed' => (int) collect($challenges)->where('status', 'claimed')->sum('xp'),
            ],
        ];
    }

    /** Today's race: who completed the most, then who finished first. */
    public function leaderboard(User $viewer, int $limit = 20): array
    {
        $date = CarbonImmutable::today();

        $rows = DailyChallengeAssignment::query()
            ->with(['user:id,first_name,last_name,username', 'def'])
            ->whereDate('date', $date)
            ->whereIn('status', ['completed', 'claimed'])
            ->get();

        $byUser = $rows->groupBy('user_id')->map(function ($group) {
            $completedAt = $group->pluck('completed_at')->filter()->sort()->last();
            return [
                'completed' => $group->count(),
                'xp' => (int) $group->sum('xp_awarded'),
                'last_finished_at' => $completedAt?->toIso8601String(),
                'first_finished_at' => $group->pluck('completed_at')->filter()->sort()->first()?->toIso8601String(),
            ];
        });

        $entries = $byUser->map(function ($stats, $userId) {
            $user = User::query()->select('id', 'first_name', 'last_name', 'username')->find($userId);
            if (!$user) {
                return null;
            }
            return [
                'user_id' => (string) $user->id,
                'name' => $user->first_name ? trim($user->first_name.' '.$user->last_name) : ($user->username ?? 'Student'),
                'username' => $user->username,
                ...$stats,
            ];
        })->filter()->values();

        // Most completed first; among equals, earlier last_finished wins the race.
        $entries = $entries->sortBy([
            ['completed', 'desc'],
            ['last_finished_at', 'asc'],
        ])->values();

        $meIndex = $entries->search(fn ($e) => $e['user_id'] === (string) $viewer->id);
        $me = $meIndex === false ? null : $entries[$meIndex];

        return [
            'date' => $date->toDateString(),
            'top' => $entries->take($limit)->values(),
            'me' => $me,
        ];
    }

    /** Other students' completed challenges today (activity feed). */
    public function activity(User $viewer, int $limit = 30): array
    {
        $rows = DailyChallengeAssignment::query()
            ->with(['user:id,first_name,last_name,username', 'def'])
            ->whereDate('date', CarbonImmutable::today())
            ->where('user_id', '!=', $viewer->id)
            ->whereIn('status', ['completed', 'claimed'])
            ->orderByDesc('completed_at')
            ->limit($limit)
            ->get();

        return $rows->map(fn (DailyChallengeAssignment $row) => [
            'id' => (string) $row->id,
            'user_id' => (string) $row->user_id,
            'name' => $row->user?->first_name
                ? trim($row->user->first_name.' '.$row->user->last_name)
                : ($row->user?->username ?? 'Student'),
            'challenge' => $row->def?->title,
            'key' => $row->def?->key,
            'action' => $row->def?->action,
            'xp' => (int) ($row->def?->xp ?? 0),
            'status' => $row->status,
            'completed_at' => $row->completed_at?->toIso8601String(),
            'detail' => $row->detail,
        ])->values()->all();
    }

    /** Students available to challenge (role Student, not me). */
    public function peers(User $viewer, int $limit = 20): array
    {
        return User::query()
            ->where('id', '!=', $viewer->id)
            ->whereDoesntHave('roles', fn ($q) => $q->whereIn('name', ['Admin', 'Super Admin', 'Instructor', 'Support']))
            ->orderBy('first_name')
            ->limit($limit)
            ->get(['id', 'first_name', 'last_name', 'username'])
            ->map(fn (User $u) => [
                'user_id' => (string) $u->id,
                'name' => $u->first_name ? trim($u->first_name.' '.$u->last_name) : ($u->username ?? 'Student'),
                'username' => $u->username,
            ])->values()->all();
    }

    public function challenge(User $challenger, string $challengedId): array
    {
        $challenged = User::query()->find($challengedId);
        if (!$challenged || $challenged->id === $challenger->id) {
            throw new \RuntimeException('Invalid student.');
        }

        $rival = DailyChallengeRival::query()->firstOrCreate(
            [
                'challenger_id' => $challenger->id,
                'challenged_id' => $challenged->id,
                'date' => CarbonImmutable::today()->toDateString(),
            ],
            ['status' => 'pending'],
        );

        return $this->presentRival($rival, $challenger);
    }

    public function accept(User $user, string $rivalId): array
    {
        $rival = DailyChallengeRival::query()->find($rivalId);
        if (!$rival || $rival->challenged_id !== $user->id) {
            throw new \RuntimeException('Not found.');
        }
        if ($rival->status === 'pending') {
            $rival->update(['status' => 'accepted']);
        }

        return $this->presentRival($rival->fresh(), $user);
    }

    public function rivals(User $user): array
    {
        return DailyChallengeRival::query()
            ->where(function ($q) use ($user) {
                $q->where('challenger_id', $user->id)->orWhere('challenged_id', $user->id);
            })
            ->whereDate('date', CarbonImmutable::today())
            ->orderByDesc('id')
            ->get()
            ->map(fn (DailyChallengeRival $r) => $this->presentRival($r, $user))
            ->values()
            ->all();
    }

    /**
     * Shared head-to-head snapshot: both students' boards side by side.
     * Winner = more completed; tie-break = earlier last finished_at.
     */
    public function shareResult(User $viewer, string $rivalId): array
    {
        $rival = DailyChallengeRival::query()->find($rivalId);
        if (!$rival || ($rival->challenger_id !== $viewer->id && $rival->challenged_id !== $viewer->id)) {
            throw new \RuntimeException('Not found.');
        }

        $a = User::query()->findOrFail($rival->challenger_id);
        $b = User::query()->findOrFail($rival->challenged_id);

        $sideA = $this->raceSide($a);
        $sideB = $this->raceSide($b);

        $winner = null;
        if ($sideA['completed'] !== $sideB['completed']) {
            $winner = $sideA['completed'] > $sideB['completed'] ? $sideA : $sideB;
        } elseif ($sideA['last_finished_at'] && $sideB['last_finished_at']) {
            if ($sideA['last_finished_at'] < $sideB['last_finished_at']) {
                $winner = $sideA;
            } elseif ($sideB['last_finished_at'] < $sideA['last_finished_at']) {
                $winner = $sideB;
            }
        }

        $payload = [
            'date' => $rival->date?->toDateString() ?? CarbonImmutable::today()->toDateString(),
            'status' => $rival->status,
            'you' => $sideA['user_id'] === (string) $viewer->id ? $sideA : $sideB,
            'them' => $sideA['user_id'] === (string) $viewer->id ? $sideB : $sideA,
            'winner' => $winner,
            'challenger' => $sideA,
            'challenged' => $sideB,
        ];

        if ($rival->status === 'accepted') {
            $rival->update(['result' => $payload]);
        }

        return $payload;
    }

    private function raceSide(User $user): array
    {
        $board = $this->todayFor($user);
        $rows = collect($board['challenges']);
        $completedAt = DailyChallengeAssignment::query()
            ->where('user_id', $user->id)
            ->whereDate('date', CarbonImmutable::today())
            ->whereIn('status', ['completed', 'claimed'])
            ->pluck('completed_at')
            ->filter()
            ->sort();

        return [
            'user_id' => (string) $user->id,
            'name' => $user->first_name ? trim($user->first_name.' '.$user->last_name) : ($user->username ?? 'Student'),
            'username' => $user->username,
            'completed' => (int) $board['summary']['done'],
            'total' => (int) $board['summary']['total'],
            'xp_claimed' => (int) $board['summary']['xp_claimed'],
            'last_finished_at' => $completedAt->last()?->toIso8601String(),
            'challenges' => $rows->map(fn ($c) => [
                'key' => $c['key'],
                'title' => $c['title'],
                'status' => $c['status'],
                'progress' => $c['progress'],
                'target' => $c['target'],
                'completed_at' => $c['completed_at'],
            ])->values()->all(),
        ];
    }

    private function presentRival(DailyChallengeRival $rival, User $viewer): array
    {
        $otherId = $rival->challenger_id === $viewer->id ? $rival->challenged_id : $rival->challenger_id;
        $other = User::query()->select('id', 'first_name', 'last_name', 'username')->find($otherId);

        return [
            'id' => (string) $rival->id,
            'date' => $rival->date?->toDateString(),
            'status' => $rival->status,
            'direction' => $rival->challenger_id === $viewer->id ? 'sent' : 'received',
            'peer' => [
                'user_id' => (string) $otherId,
                'name' => $other?->first_name ? trim($other->first_name.' '.$other->last_name) : ($other?->username ?? 'Student'),
                'username' => $other?->username,
            ],
            'result' => $rival->result,
        ];
    }

    private function presentChallenge(DailyChallengeDef $def, DailyChallengeAssignment $row): array
    {
        return [
            'id' => (string) $row->id,
            'key' => $def->key,
            'title' => $def->title,
            'description' => $def->description,
            'action' => $def->action,
            'route' => $def->route,
            'xp' => $def->xp,
            'status' => $row->status,
            'progress' => (int) $row->progress,
            'target' => (int) $row->target,
            'completed_at' => $row->completed_at?->toIso8601String(),
            'detail' => $row->detail,
        ];
    }

    private function findOrCreateAssignment(User $user, DailyChallengeDef $def, CarbonImmutable $date): DailyChallengeAssignment
    {
        $row = DailyChallengeAssignment::query()
            ->where('user_id', $user->id)
            ->where('daily_challenge_def_id', $def->id)
            ->whereDate('date', $date)
            ->first();

        if ($row) {
            return $row;
        }

        return DailyChallengeAssignment::create([
            'user_id' => $user->id,
            'daily_challenge_def_id' => $def->id,
            'date' => $date->toDateString(),
            'status' => 'pending',
            'progress' => 0,
            'target' => $def->target,
            'xp_awarded' => 0,
        ]);
    }
}
