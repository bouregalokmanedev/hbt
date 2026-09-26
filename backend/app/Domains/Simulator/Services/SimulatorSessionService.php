<?php

namespace App\Domains\Simulator\Services;

use App\Domains\Payments\Services\SubscriptionEntitlementService;
use App\Domains\Simulator\DTOs\CompleteSimulatorSessionData;
use App\Domains\Simulator\DTOs\StartSimulatorSessionData;
use App\Domains\Simulator\Models\SimulatorResult;
use App\Domains\Simulator\Models\SimulatorSession;
use App\Domains\Simulator\Support\VehicleKey;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SimulatorSessionService
{
    public function __construct(
        private readonly SubscriptionEntitlementService $entitlements,
    ) {
    }

    public function start(StartSimulatorSessionData $data): SimulatorSession
    {
        $this->guardMonthlyLimit($data->userId);

        return SimulatorSession::create([
            'user_id' => $data->userId,
            // Stored canonical (never `backend:`-prefixed) so instructor
            // breakdowns group one row per real vehicle.
            'vehicle_key' => VehicleKey::forStorage($data->vehicleKey),
            'tool' => $data->tool,
            'scenario_key' => $data->scenarioKey,
            'status' => 'active',
            'started_at' => now(),
        ]);
    }

    /**
     * Sessions started by this user in the current calendar month.
     */
    public function monthlyUsage(int $userId): int
    {
        return SimulatorSession::query()
            ->where('user_id', $userId)
            ->where('started_at', '>=', now()->startOfMonth())
            ->count();
    }

    /**
     * Free tier starts 5 sessions per month; paid plans stay unlimited
     * unless their plan features cap them explicitly.
     *
     * @throws ValidationException when the monthly cap is exhausted
     */
    private function guardMonthlyLimit(int $userId): void
    {
        $user = User::query()->find($userId);

        if (! $user) {
            return;
        }

        $limit = $this->entitlements->simulatorSessionMonthlyLimit($user);

        if ($limit === null) {
            return;
        }

        if ($this->monthlyUsage($userId) < $limit) {
            return;
        }

        throw ValidationException::withMessages([
            'sessions' => "You have used all {$limit} simulator sessions for this month. Upgrade to Pro for unlimited sessions.",
        ]);
    }

    public function complete(
        SimulatorSession $session,
        CompleteSimulatorSessionData $data,
    ): SimulatorResult {
        if ($session->user_id !== $data->userId) {
            throw ValidationException::withMessages([
                'session' => 'You do not own this simulator session.',
            ]);
        }

        if ($session->status !== 'active') {
            throw ValidationException::withMessages([
                'session' => 'This simulator session is no longer active.',
            ]);
        }

        return DB::transaction(function () use ($session, $data) {
            $endedAt = now();

            // duration_seconds is an integer column — never store a float
            // (diffInSeconds() returns a float and Postgres rejects "1.04").
            $duration = $data->durationSeconds !== null ? (int) $data->durationSeconds : null;

            if ($duration === null && $session->started_at !== null) {
                $duration = (int) round($session->started_at->diffInSeconds($endedAt));
            }

            $session->update([
                'status' => 'completed',
                'ended_at' => $endedAt,
                'duration_seconds' => $duration,
                'score' => $data->score,
                // Backfill the scenario when the lab only learns it at completion.
                'scenario_key' => $session->scenario_key ?: $data->scenarioKey,
            ]);

            $result = SimulatorResult::create([
                'session_id' => $session->id,
                'user_id' => $data->userId,
                'tool' => $session->tool,
                'scenario_key' => $session->scenario_key ?: $data->scenarioKey,
                'score' => $data->score,
                'outcome' => $data->outcome,
                'verdict' => $data->verdict,
                'attempts' => max(1, $data->attempts),
                'hints_used' => max(0, $data->hintsUsed),
                'duration_seconds' => $duration,
                'steps' => $data->steps,
                'metadata' => $data->metadata,
            ]);

            // Bench work counts as a learning day: awards XP and advances the
            // streak via the shared progression service (dedupe per session).
            if ($user = User::query()->find($data->userId)) {
                app(\App\Domains\Progression\Services\StudentProgressionService::class)->award(
                    $user,
                    'simulator_completed',
                    10,
                    18,
                    "simulator-session:{$session->id}",
                    ['label' => 'Simulator bench completed', 'tool' => $session->tool, 'score' => $data->score],
                );
                app(\App\Domains\Challenges\Services\DailyChallengeService::class)->trackAction($user, 'simulator_complete', [
                    'tool' => $session->tool,
                    'score' => $data->score,
                    'outcome' => $data->outcome,
                ]);
            }

            return $result;
        });
    }
}