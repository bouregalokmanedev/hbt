<?php

namespace App\Domains\Payments\Http\Controllers;

use App\Domains\Payments\Models\PaymentProviderPlan;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentProviderPlanController extends Controller
{
    public function index(string $planId): JsonResponse
    {
        $plan = \App\Domains\Payments\Models\Plan::findOrFail($planId);
        $mappings = PaymentProviderPlan::where('subscription_plan_id', $plan->id)->get();

        return response()->json([
            'success' => true,
            'message' => 'Provider mappings retrieved.',
            'data' => $mappings,
        ]);
    }

    public function upsert(Request $request, string $planId): JsonResponse
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

        $plan = \App\Domains\Payments\Models\Plan::findOrFail($planId);

        $mapping = PaymentProviderPlan::updateOrCreate(
            ['subscription_plan_id' => $plan->id, 'provider' => $data['provider']],
            $data,
        );

        return response()->json([
            'success' => true,
            'message' => 'Provider mapping saved.',
            'data' => $mapping,
        ]);
    }
}
