<?php

namespace App\Domains\Payments\Http\Controllers;

use App\Domains\Payments\Models\PaymentMethod;
use App\Domains\Payments\Services\PaymentMethodService;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $methods = PaymentMethod::where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (PaymentMethod $m) => $this->serialize($m));

        return response()->json([
            'success' => true,
            'message' => 'Payment methods retrieved.',
            'data' => $methods,
        ]);
    }

    public function store(Request $request, PaymentMethodService $service): JsonResponse
    {
        $data = $request->validate([
            'provider' => ['sometimes', 'string', 'in:stripe,paypal,manual,tamara'],
            'provider_payment_method_id' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'string', 'in:card,apple_pay,paypal,tamara'],
            'brand' => ['nullable', 'string', 'max:30'],
            'last_four' => ['nullable', 'string', 'size:4'],
            'exp_month' => ['nullable', 'integer', 'min:1', 'max:12'],
            'exp_year' => ['nullable', 'integer', 'min:2024', 'max:2100'],
            'billing_name' => ['nullable', 'string', 'max:150'],
            'billing_country' => ['nullable', 'string', 'size:2'],
        ]);

        $method = $service->attach($request->user(), $data);

        return response()->json([
            'success' => true,
            'message' => 'Payment method saved.',
            'data' => $this->serialize($method),
        ], 201);
    }

    public function setDefault(Request $request, PaymentMethod $paymentMethod, PaymentMethodService $service): JsonResponse
    {
        $this->authorize('setDefault', $paymentMethod);

        $method = $service->setDefault($request->user(), $paymentMethod);

        return response()->json([
            'success' => true,
            'message' => 'Default payment method updated.',
            'data' => $this->serialize($method),
        ]);
    }

    public function destroy(PaymentMethod $paymentMethod, PaymentMethodService $service): JsonResponse
    {
        $this->authorize('delete', $paymentMethod);

        $service->detach($paymentMethod);

        return response()->json(['success' => true, 'message' => 'Payment method removed.']);
    }

    private function serialize(PaymentMethod $method): array
    {
        return [
            'id' => $method->id,
            'provider' => $method->provider->value,
            'type' => $method->type->value,
            'brand' => $method->brand,
            'last_four' => $method->last_four,
            'exp_month' => $method->exp_month,
            'exp_year' => $method->exp_year,
            'is_default' => (bool) $method->is_default,
            'display_name' => $method->displayName(),
            'created_at' => $method->created_at?->toISOString(),
        ];
    }
}
