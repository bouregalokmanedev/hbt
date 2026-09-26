<?php

namespace App\Domains\Analytics\Http\Controllers;

use App\Domains\Analytics\Models\AnalyticsEvent;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Conversion funnel sink. The event whitelist is deliberate: only the
 * signup/revenue funnel events we report on are accepted, everything
 * else is rejected with 422 instead of silently filling the table.
 */
class StoreAnalyticsEventController extends Controller
{
    private const ALLOWED_EVENTS = [
        'pricing_viewed',
        'plan_cta_clicked',
        'simulator_limit_reached',
        'referral_invite_shared',
    ];

    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event' => ['required', 'string', Rule::in(self::ALLOWED_EVENTS)],
            'page' => ['nullable', 'string', 'max:191'],
            'properties' => ['nullable', 'array', 'max:12'],
            'properties.*' => ['nullable', 'string', 'max:255'],
            'session_hash' => ['nullable', 'string', 'max:64'],
        ]);

        AnalyticsEvent::create([
            // The route is public (logged-out visitors count too), so the
            // sanctum guard is resolved manually instead of via middleware.
            'user_id' => Auth::guard('sanctum')->id(),
            'event' => $data['event'],
            'page' => $data['page'] ?? null,
            'properties' => $data['properties'] ?? null,
            'session_hash' => $data['session_hash'] ?? null,
        ]);

        return response()->json(['success' => true], 202);
    }
}
