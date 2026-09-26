<?php

namespace App\Domains\RiskManagement\Controllers;

use App\Domains\RiskManagement\Actions\ReviewRiskAction;
use App\Domains\RiskManagement\Models\Risk;
use App\Domains\RiskManagement\Queries\RiskReportQuery;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiskReportController extends Controller
{
    use AuthorizesRequests;

    public function dashboard(RiskReportQuery $query): JsonResponse
    {
        $this->authorize('viewAny', Risk::class);
        return response()->json(['success' => true, 'data' => $query->dashboard()]);
    }

    public function overdue(RiskReportQuery $query): JsonResponse
    {
        $this->authorize('viewAny', Risk::class);
        return response()->json(['success' => true, 'data' => $query->overdueReviews()]);
    }

    public function failedControls(RiskReportQuery $query): JsonResponse
    {
        $this->authorize('viewAny', Risk::class);
        return response()->json(['success' => true, 'data' => $query->failedControls()]);
    }

    public function review(Request $request, Risk $risk, ReviewRiskAction $action): JsonResponse
    {
        $this->authorize('update', $risk);
        $data = $request->validate([
            'outcome' => ['required', 'string', 'in:continued,mitigated,accepted,closed'],
            'notes' => ['nullable', 'string'],
            'next_review_at' => ['nullable', 'date'],
        ]);

        $risk = $action->execute($risk, $request->user()->id, $data['outcome'], $data['notes'] ?? null, $data['next_review_at'] ?? null);

        return response()->json(['success' => true, 'message' => 'Risk reviewed.', 'data' => ['id' => $risk->id, 'status' => $risk->status]]);
    }
}
