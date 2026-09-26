<?php

namespace App\Domains\RiskManagement\Controllers;

use App\Domains\RiskManagement\Actions\AssessRiskAction;
use App\Domains\RiskManagement\Actions\CreateRiskAction;
use App\Domains\RiskManagement\Models\Risk;
use App\Domains\RiskManagement\Queries\RiskDashboardQuery;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiskController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Risk::class);

        $risks = Risk::with(['category:id,name', 'owner:id,first_name,last_name'])
            ->latest()
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        return response()->json([
            'data' => $risks->getCollection()->map(fn (Risk $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'level' => $r->level,
                'score' => $r->score,
                'status' => $r->status,
                'category' => $r->category?->name,
                'next_review_at' => $r->next_review_at?->toISOString(),
            ]),
            'meta' => [
                'current_page' => $risks->currentPage(),
                'last_page' => $risks->lastPage(),
                'per_page' => $risks->perPage(),
                'total' => $risks->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function store(Request $request, CreateRiskAction $create): JsonResponse
    {
        $this->authorize('create', Risk::class);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'uuid', 'exists:risk_categories,id'],
            'probability' => ['required', 'integer', 'min:1', 'max:5'],
            'impact' => ['required', 'integer', 'min:1', 'max:5'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $risk = $create->execute($data, $request->user()->tenant_id);

        return response()->json(['success' => true, 'message' => 'Risk created.', 'data' => ['id' => $risk->id, 'score' => $risk->score, 'level' => $risk->level]], 201);
    }

    public function show(Risk $risk): JsonResponse
    {
        $this->authorize('view', $risk);
        $risk->load(['category:id,name', 'owner:id,first_name,last_name', 'assessments', 'treatments', 'controls']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $risk->id,
                'title' => $risk->title,
                'description' => $risk->description,
                'level' => $risk->level,
                'score' => $risk->score,
                'status' => $risk->status,
                'probability' => $risk->probability,
                'impact' => $risk->impact,
                'assessments' => $risk->assessments,
                'treatments' => $risk->treatments,
                'controls' => $risk->controls,
            ],
        ]);
    }

    public function assess(Request $request, Risk $risk, AssessRiskAction $assess): JsonResponse
    {
        $this->authorize('assess', $risk);

        $data = $request->validate([
            'probability' => ['required', 'integer', 'min:1', 'max:5'],
            'impact' => ['required', 'integer', 'min:1', 'max:5'],
            'notes' => ['nullable', 'string'],
        ]);

        $risk = $assess->execute($risk, $data['probability'], $data['impact'], $request->user()->id, $data['notes'] ?? null);

        return response()->json(['success' => true, 'message' => 'Risk assessed.', 'data' => ['id' => $risk->id, 'score' => $risk->score, 'level' => $risk->level]]);
    }

    public function dashboard(RiskDashboardQuery $query): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $query->overview()]);
    }
}
