<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Payments\Models\Plan;
use App\Http\Controllers\Controller;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPlanController extends Controller
{
    public function index(): JsonResponse
    {
        $plans = Plan::query()
            ->orderBy('price')
            ->get()
            ->map(fn (Plan $plan) => $this->serialize($plan));

        return response()->json([
            'success' => true,
            'message' => 'Plans retrieved.',
            'data' => $plans,
        ]);
    }

    public function store(Request $request, AuditService $audit): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:150', 'unique:plans,slug'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'integer', 'min:0'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'interval' => ['sometimes', 'string', 'in:month,year,lifetime'],
            'trial_days' => ['sometimes', 'integer', 'min:0'],
            'features' => ['sometimes', 'array'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $plan = Plan::create($data);

        $audit->log('plan.created', $plan, [], ['name' => $plan->name, 'price' => $plan->price]);

        return response()->json([
            'success' => true,
            'message' => 'Plan created.',
            'data' => $this->serialize($plan),
        ], 201);
    }

    public function update(Request $request, Plan $plan, AuditService $audit): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'slug' => ['sometimes', 'string', 'max:150', Rule::unique('plans', 'slug')->ignore($plan->id)],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'integer', 'min:0'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'interval' => ['sometimes', 'string', 'in:month,year,lifetime'],
            'trial_days' => ['sometimes', 'integer', 'min:0'],
            'features' => ['sometimes', 'array'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $old = $plan->only(array_keys($data));
        $plan->update($data);

        $audit->log('plan.updated', $plan, $old, $plan->only(array_keys($data)));

        return response()->json([
            'success' => true,
            'message' => 'Plan updated.',
            'data' => $this->serialize($plan->fresh()),
        ]);
    }

    public function destroy(Plan $plan, AuditService $audit): JsonResponse
    {
        $audit->log('plan.deleted', $plan, ['name' => $plan->name], []);

        $plan->delete();

        return response()->json(['message' => 'Plan deleted successfully.']);
    }

    private function serialize(Plan $plan): array
    {
        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'slug' => $plan->slug,
            'description' => $plan->description,
            'price' => $plan->price,
            'currency' => $plan->currency,
            'interval' => $plan->interval,
            'trial_days' => $plan->trial_days,
            'features' => $plan->features ?? [],
            'active' => (bool) $plan->active,
            'subscribers' => $plan->subscriptions()->count(),
            'created_at' => $plan->created_at?->toISOString(),
        ];
    }
}
