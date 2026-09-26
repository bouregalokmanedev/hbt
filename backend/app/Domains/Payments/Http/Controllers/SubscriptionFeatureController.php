<?php

namespace App\Domains\Payments\Http\Controllers;

use App\Domains\Payments\Models\SubscriptionFeature;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionFeatureController extends Controller
{
    public function index(): JsonResponse
    {
        $features = SubscriptionFeature::orderBy('key')->get(['id', 'key', 'name', 'description', 'type']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription features retrieved.',
            'data' => $features,
        ]);
    }

    public function planFeatures(string $planId): JsonResponse
    {
        $plan = \App\Domains\Payments\Models\Plan::findOrFail($planId);

        $features = \DB::table('subscription_plan_features')
            ->join('subscription_features', 'subscription_features.id', '=', 'subscription_plan_features.subscription_feature_id')
            ->where('subscription_plan_features.subscription_plan_id', $plan->id)
            ->select('subscription_features.id', 'subscription_features.key', 'subscription_features.name', 'subscription_plan_features.value')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Plan features retrieved.',
            'data' => $features,
        ]);
    }

    public function syncPlanFeatures(Request $request, string $planId): JsonResponse
    {
        $data = $request->validate([
            'features' => ['required', 'array'],
            'features.*.key' => ['required', 'string', 'exists:subscription_features,key'],
            'features.*.value' => ['required', 'string', 'max:255'],
        ]);

        $plan = \App\Domains\Payments\Models\Plan::findOrFail($planId);

        \DB::transaction(function () use ($plan, $data) {
            \DB::table('subscription_plan_features')->where('subscription_plan_id', $plan->id)->delete();
            foreach ($data['features'] as $feature) {
                $featureModel = SubscriptionFeature::where('key', $feature['key'])->firstOrFail();
                \DB::table('subscription_plan_features')->insert([
                    'id' => (string) \Illuminate\Support\Str::uuid(),
                    'subscription_plan_id' => $plan->id,
                    'subscription_feature_id' => $featureModel->id,
                    'value' => $feature['value'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Plan features updated.',
            'data' => ['plan_id' => $plan->id],
        ]);
    }
}
