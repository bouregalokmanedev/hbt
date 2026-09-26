<?php

namespace App\Domains\Payments\Controllers;

use App\Domains\Payments\Enums\SubscriptionStatus;
use App\Domains\Payments\Models\Plan;
use App\Domains\Payments\Models\Subscription;
use App\Domains\Payments\Services\SubscriptionService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function plans(): JsonResponse
    {
        $plans = Plan::query()
            ->where('active', true)
            ->orderBy('price')
            ->get(['id', 'name', 'slug', 'description', 'price', 'currency', 'interval', 'trial_days', 'features']);

        return response()->json([
            'success' => true,
            'message' => 'Plans retrieved.',
            'data' => $plans,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $subscriptions = Subscription::query()
            ->with('plan:id,name,slug,price,currency,interval')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (Subscription $subscription) => [
                'id' => $subscription->id,
                'plan' => $subscription->plan?->name,
                'status' => $subscription->status->value,
                'current_period_ends_at' => $subscription->current_period_ends_at?->toISOString(),
                'cancelled_at' => $subscription->cancelled_at?->toISOString(),
                'created_at' => $subscription->created_at?->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscriptions retrieved.',
            'data' => $subscriptions,
        ]);
    }

    public function store(Request $request, SubscriptionService $subscriptions): JsonResponse
    {
        $data = $request->validate([
            'plan_id' => ['required', 'uuid', 'exists:plans,id'],
            'provider' => ['sometimes', 'string', 'in:stripe,paypal,manual'],
        ]);

        $subscription = $subscriptions->create(
            $request->user(),
            $data['plan_id'],
            $data['provider'] ?? 'stripe',
        );

        return response()->json([
            'success' => true,
            'message' => 'Subscription created. Awaiting provider confirmation via webhook.',
            'data' => ['id' => $subscription->id, 'status' => $subscription->status->value],
        ], 201);
    }

    public function cancel(Request $request, Subscription $subscription, \App\Domains\Payments\Services\SubscriptionService $service): JsonResponse
    {
        abort_unless($subscription->user_id === $request->user()->id, 403);

        $subscription = $service->cancel($subscription, true);

        return response()->json([
            'success' => true,
            'message' => 'Subscription will end at the current period. Use immediate cancel from admin if needed.',
            'data' => ['id' => $subscription->id, 'status' => $subscription->status->value],
        ]);
    }

    public function changePlan(Request $request, Subscription $subscription, \App\Domains\Payments\Services\SubscriptionService $service): JsonResponse
    {
        abort_unless($subscription->user_id === $request->user()->id, 403);

        $data = $request->validate(['plan_id' => ['required', 'uuid', 'exists:plans,id']]);

        $subscription = $service->changePlan($subscription, $data['plan_id']);

        return response()->json([
            'success' => true,
            'message' => 'Subscription plan changed via provider.',
            'data' => ['id' => $subscription->id],
        ]);
    }
}
