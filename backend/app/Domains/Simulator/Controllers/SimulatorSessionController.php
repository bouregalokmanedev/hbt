<?php

namespace App\Domains\Simulator\Controllers;

use App\Domains\Simulator\DTOs\CompleteSimulatorSessionData;
use App\Domains\Simulator\DTOs\StartSimulatorSessionData;
use App\Domains\Simulator\Models\SimulatorSession;
use App\Domains\Simulator\Requests\CompleteSimulatorSessionRequest;
use App\Domains\Simulator\Requests\StartSimulatorSessionRequest;
use App\Domains\Simulator\Resources\SimulatorResultResource;
use App\Domains\Simulator\Resources\SimulatorSessionResource;
use App\Domains\Simulator\Services\SimulatorManifestService;
use App\Domains\Simulator\Services\SimulatorSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SimulatorSessionController
{
    public function __construct(
        private readonly SimulatorSessionService $service,
    ) {
    }

    public function store(
        StartSimulatorSessionRequest $request,
    ): JsonResponse {
        $user = $request->user();

        $data = new StartSimulatorSessionData(
            userId: $user->id,
            vehicleKey: $request->string('vehicle_key')->toString(),
            tool: $request->string('tool')->toString(),
            scenarioKey: $request->input('scenario_key'),
        );

        $session = $this->service->start($data);

        return response()->json([
            'data' => new SimulatorSessionResource($session),
        ], 201);
    }

    public function complete(
        CompleteSimulatorSessionRequest $request,
        SimulatorSession $session,
    ): JsonResponse {
        $user = $request->user();

        $data = new CompleteSimulatorSessionData(
            userId: $user->id,
            score: $request->integer('score'),
            outcome: $request->input('outcome'),
            verdict: $request->input('verdict'),
            attempts: max(1, $request->integer('attempts', 1)),
            hintsUsed: max(0, $request->integer('hints_used', 0)),
            durationSeconds: $request->filled('duration_seconds')
                ? (int) $request->input('duration_seconds')
                : null,
            steps: $request->input('steps'),
            metadata: $request->input('metadata'),
            scenarioKey: $request->filled('scenario_key')
                ? $request->string('scenario_key')->toString()
                : null,
        );

        $result = $this->service->complete(
            $session,
            $data,
        );

        return response()->json([
            'data' => new SimulatorResultResource($result),
        ]);
    }

    public function usage(
        Request $request,
        \App\Domains\Payments\Services\SubscriptionEntitlementService $entitlements,
    ): JsonResponse {
        $user = $request->user();

        $limit = $entitlements->simulatorSessionMonthlyLimit($user);
        $used = $this->service->monthlyUsage($user->id);

        return response()->json([
            'data' => [
                'used' => $used,
                'limit' => $limit,
                'remaining' => $limit === null ? null : max(0, $limit - $used),
                'unlimited' => $limit === null,
                'resets_at' => now()->startOfMonth()->addMonth()->startOfDay()->toIso8601String(),
            ],
        ]);
    }

    public function results(Request $request): JsonResponse
    {
        $results = $request->user()
            ->simulatorResults()
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => SimulatorResultResource::collection(
                $results
            ),
            'meta' => [
                'current_page' => $results->currentPage(),
                'last_page' => $results->lastPage(),
                'per_page' => $results->perPage(),
                'total' => $results->total(),
            ],
        ]);
    }

    public function manifest(Request $request, \App\Domains\DiagnosticScenarios\Models\DiagnosticScenario $scenario, SimulatorManifestService $manifests): JsonResponse
    {
        $user = $request->user();

        abort_unless(
            $scenario->status === \App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus::PUBLISHED
                || $user->hasAnyRole(['Admin', 'Super Admin', 'Instructor']),
            404,
        );

        return response()->json([
            'data' => $manifests->forScenario($scenario),
        ]);
    }
}