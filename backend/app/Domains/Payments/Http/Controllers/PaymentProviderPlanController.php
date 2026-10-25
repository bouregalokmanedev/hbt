<?php

namespace App\Domains\Payments\Http\Controllers;

use App\Domains\Payments\Models\PaymentProviderPlan;
use App\Domains\Payments\Models\Plan;
use App\Http\Controllers\Controller;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentProviderPlanController extends Controller
{
    public function index(Plan $plan): JsonResponse
    {
        $mappings = PaymentProviderPlan::where('subscription_plan_id', $plan->id)->get();

        return response()->json([
            'success' => true,
            'message' => 'Provider mappings retrieved.',
            'data' => $mappings,
        ]);
    }

    public function upsert(Request $request, Plan $plan, AuditService $audit): JsonResponse
    {
        $data = $request->validate([
            'provider' => ['required', 'string', 'in:stripe,paypal'],
            'external_product_id' => ['nullable', 'string', 'max:255'],
            'external_plan_id' => ['nullable', 'string', 'max:255'],
            'external_price_id' => ['nullable', 'string', 'max:255'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'amount' => ['sometimes', 'integer', 'min:0'],
            'status' => ['sometimes', 'string', 'in:active,inactive'],
        ]);

        $mapping = PaymentProviderPlan::updateOrCreate(
            ['subscription_plan_id' => $plan->id, 'provider' => $data['provider']],
            $data,
        );

        $audit->log('plan.provider_mapping.updated', $mapping, [], $mapping->only([
            'provider', 'external_product_id', 'external_plan_id', 'external_price_id', 'status',
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Provider mapping saved.',
            'data' => $mapping,
        ]);
    }
}
