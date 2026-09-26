<?php

namespace App\Domains\Simulator\Controllers;

use App\Domains\Simulator\Queries\SimulatorActivityQuery;
use App\Domains\Simulator\Resources\SimulatorResultResource;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InstructorSimulatorActivityController
{
    use AuthorizesRequests;

    public function analytics(Request $request): JsonResponse
    {
        $this->assertInstructor($request);

        return response()->json([
            'data' => SimulatorActivityQuery::forInstructor((int) $request->user()->id)->analytics(),
        ]);
    }

    public function sessions(Request $request): JsonResponse
    {
        $this->assertInstructor($request);

        $data = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'tool' => ['nullable', 'string', 'max:40'],
            'status' => ['nullable', 'string', 'in:active,completed'],
            'vehicle' => ['nullable', 'string', 'max:120'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'user_id' => ['nullable', 'integer'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $paginator = SimulatorActivityQuery::forInstructor((int) $request->user()->id)
            ->paginate($data);

        return response()->json([
            'data' => collect($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function studentSessions(Request $request, int $student): JsonResponse
    {
        $this->assertInstructor($request);

        return response()->json([
            'data' => SimulatorActivityQuery::forInstructor((int) $request->user()->id)
                ->studentActivity($student),
        ]);
    }

    public function studentResults(Request $request, int $student): JsonResponse
    {
        $this->assertInstructor($request);

        $activity = SimulatorActivityQuery::forInstructor((int) $request->user()->id)
            ->studentActivity($student);

        $sessionIds = collect($activity['sessions'])->pluck('id');
        $results = \App\Domains\Simulator\Models\SimulatorResult::query()
            ->whereIn('session_id', $sessionIds)
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'data' => SimulatorResultResource::collection($results),
        ]);
    }

    private function assertInstructor(Request $request): void
    {
        abort_unless($request->user()?->hasRole('Instructor'), 403, 'Instructor role required.');
    }
}
