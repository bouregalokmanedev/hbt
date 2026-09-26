<?php

namespace App\Domains\Simulator\Controllers;

use App\Domains\Simulator\Queries\SimulatorActivityQuery;
use App\Domains\Simulator\Resources\SimulatorResultResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSimulatorActivityController
{
    public function analytics(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

        return response()->json([
            'data' => SimulatorActivityQuery::forAdmin()->analytics(),
        ]);
    }

    public function sessions(Request $request): JsonResponse
    {
        $this->assertAdmin($request);

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

        $paginator = SimulatorActivityQuery::forAdmin()->paginate($data);

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

    public function studentSessions(Request $request, User $student): JsonResponse
    {
        $this->assertAdmin($request);
        abort_unless($student->hasRole('Student'), 404, 'Student not found.');

        return response()->json([
            'data' => SimulatorActivityQuery::forAdmin()->studentActivity($student->id),
        ]);
    }

    public function studentResults(Request $request, User $student): JsonResponse
    {
        $this->assertAdmin($request);
        abort_unless($student->hasRole('Student'), 404, 'Student not found.');

        $results = \App\Domains\Simulator\Models\SimulatorResult::query()
            ->where('user_id', $student->id)
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'data' => SimulatorResultResource::collection($results),
        ]);
    }

    private function assertAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->hasAnyRole(['Admin', 'Super Admin']),
            403,
            'Admin role required.',
        );
    }
}
