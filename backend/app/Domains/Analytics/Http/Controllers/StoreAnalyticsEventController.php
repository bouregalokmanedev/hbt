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
        // Visitor behaviour for the marketing workspace.
        'page_view',
        'cta_click',
        'time_on_page',
    ];

    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'event' => ['required', 'string', Rule::in(self::ALLOWED_EVENTS)],
            'page' => ['nullable', 'string', 'max:191'],
            'properties' => ['nullable', 'array', 'max:12'],
            'properties.*' => ['nullable', 'string', 'max:255'],
            'session_hash' => ['nullable', 'string', 'max:64'],
            'visitor_id' => ['nullable', 'uuid'],
            'referrer' => ['nullable', 'string', 'max:512'],
        ]);

        $userId = Auth::guard('sanctum')->id();

        AnalyticsEvent::create([
            // The route is public (logged-out visitors count too), so the
            // sanctum guard is resolved manually instead of via middleware.
            'user_id' => $userId,
            'visitor_id' => $data['visitor_id'] ?? null,
            'event' => $data['event'],
            'page' => $data['page'] ?? null,
            'properties' => $data['properties'] ?? null,
            'session_hash' => $data['session_hash'] ?? null,
            'country' => $this->countryFor($request),
            'region' => null,
            'city' => null,
            'user_agent' => substr((string) $request->userAgent(), 0, 512) ?: null,
            'referrer' => isset($data['referrer']) ? substr($data['referrer'], 0, 512) : null,
            'language' => $this->languageFor($request),
        ]);

        // Identity stitching: once the browser belongs to an account,
        // its older anonymous rows resolve to the same user.
        if ($userId && ! empty($data['visitor_id'])) {
            AnalyticsEvent::query()
                ->where('visitor_id', $data['visitor_id'])
                ->whereNull('user_id')
                ->update(['user_id' => $userId]);
        }

        return response()->json(['success' => true], 202);
    }

    /**
     * Country from edge headers when present (Cloudflare, Vercel, AWS).
     * No external lookup is performed — unknown stays null.
     */
    private function countryFor(Request $request): ?string
    {
        foreach (['CF-IPCountry', 'CloudFront-Viewer-Country', 'X-Country-Code', 'X-Appengine-Country'] as $header) {
            $value = strtoupper(trim((string) $request->header($header, '')));
            if (preg_match('/^[A-Z]{2}$/', $value) && $value !== 'XX') {
                return $value;
            }
        }

        return null;
    }

    /**
     * Primary language sub-tag of Accept-Language ("fr-CA,fr;q=0.9" -> "fr").
     * Derived server-side so no client change or extra payload is needed.
     */
    private function languageFor(Request $request): ?string
    {
        $header = (string) $request->header('Accept-Language', '');
        $first = strtolower(trim(explode(',', $header)[0] ?? ''));
        $tag = explode('-', $first)[0] ?? '';

        return preg_match('/^[a-z]{2,3}$/', $tag) === 1 ? $tag : null;
    }
}
