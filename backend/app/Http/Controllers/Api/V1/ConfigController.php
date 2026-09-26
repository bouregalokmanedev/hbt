<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ConfigController extends Controller
{
    public function stripeKey(): JsonResponse
    {
        $key = config('services.stripe.publishable_key')
            ?? config('services.stripe.key')
            ?? env('STRIPE_PUBLISHABLE_KEY')
            ?? env('STRIPE_KEY');

        return response()->json([
            'success' => true,
            'data' => [
                'publishable_key' => $key,
                'stub' => blank($key),
            ],
        ]);
    }
}
