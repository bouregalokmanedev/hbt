<?php

namespace App\Services\Security;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Cheap, provider-agnostic bot gate for unauthenticated write endpoints.
 *
 * Two layers run on every protected request:
 *  1. A hidden honeypot field that humans never see or fill.
 *  2. An optional Cloudflare Turnstile challenge, enabled only when both
 *     the site and secret keys are configured.
 *
 * Rate limiting stays in the route middleware stack; this service only
 * answers "is this request plausibly human?".
 */
final class BotProtectionService
{
    public function enabled(): bool
    {
        return (bool) config('services.bot_protection.turnstile.enabled', false)
            && filled(config('services.bot_protection.turnstile.site_key'))
            && filled(config('services.bot_protection.turnstile.secret_key'));
    }

    public function siteKey(): ?string
    {
        if (! $this->enabled()) {
            return null;
        }

        $siteKey = config('services.bot_protection.turnstile.site_key');

        return filled($siteKey) ? (string) $siteKey : null;
    }

    public function honeypotField(): string
    {
        return (string) config(
            'services.bot_protection.honeypot_field',
            'website',
        );
    }

    /**
     * @throws ValidationException
     */
    public function verify(Request $request): void
    {
        $honeypot = $this->honeypotField();

        if (filled($request->input($honeypot))) {
            Log::warning('Bot protection honeypot triggered.', [
                'path' => $request->path(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            throw ValidationException::withMessages([
                'email' => 'We could not process this request. Please try again.',
            ]);
        }

        if (! $this->enabled()) {
            return;
        }

        $token = trim((string) $request->input('turnstile_token', ''));

        if ($token === '' || ! $this->verifyTurnstile($token, $request->ip())) {
            throw ValidationException::withMessages([
                'turnstile_token' => 'Please complete the human verification challenge.',
            ]);
        }
    }

    private function verifyTurnstile(string $token, ?string $ip): bool
    {
        try {
            $response = Http::asForm()
                ->timeout(5)
                ->post(
                    (string) config('services.bot_protection.turnstile.verify_url'),
                    array_filter([
                        'secret' => config('services.bot_protection.turnstile.secret_key'),
                        'response' => $token,
                        'remoteip' => $ip,
                    ]),
                );
        } catch (\Throwable $exception) {
            Log::warning('Turnstile verification request failed.', [
                'error' => $exception->getMessage(),
            ]);

            return false;
        }

        if (! $response->successful()) {
            Log::warning('Turnstile verification returned an error.', [
                'status' => $response->status(),
            ]);

            return false;
        }

        return (bool) $response->json('success');
    }
}
