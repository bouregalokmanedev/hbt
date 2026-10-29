<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Security\BotProtectionService;
use Illuminate\Http\JsonResponse;

class ConfigController extends Controller
{
    public function stripeKey(): JsonResponse
    {
        // Reading env() at request time returns null once the config is
        // cached, which silently disabled Stripe in production.
        $key = config('services.stripe.publishable_key')
            ?? config('services.stripe.key');

        return response()->json([
            'success' => true,
            'data' => [
                'publishable_key' => $key,
                'stub' => blank($key),
            ],
        ]);
    }

    /**
     * Public bot-protection settings consumed by the login, registration
     * and contact forms. The secret never leaves the server.
     */
    public function botProtection(BotProtectionService $bots): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'enabled' => $bots->enabled(),
                'site_key' => $bots->siteKey(),
                'honeypot_field' => $bots->honeypotField(),
            ],
        ]);
    }
}
