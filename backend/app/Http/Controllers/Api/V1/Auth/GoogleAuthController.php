<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\DTOs\Auth\Results\AuthenticationResult;
use App\Domains\Students\Services\StudentSettingsService;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\Auth\AuthResource;
use App\Http\Responses\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly StudentSettingsService $studentSettingsService) {}

    public function redirect(): RedirectResponse
    {
        abort_unless(
            config('services.google.client_id') && config('services.google.client_secret'),
            503,
            'Google sign-in is not configured yet.',
        );

        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function callback(): RedirectResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        try {
            $googleUser = Socialite::driver('google')->user();
            $email = strtolower((string) $googleUser->getEmail());

            if ($email === '') {
                return redirect()->away("{$frontendUrl}/login?google_error=email_unavailable");
            }

            $user = User::withTrashed()->where('email', $email)->first();

            if ($user?->trashed()) {
                return redirect()->away("{$frontendUrl}/login?google_error=account_unavailable");
            }

            if (! $user) {
                $nameParts = preg_split('/\s+/', trim((string) $googleUser->getName())) ?: [];
                $firstName = $nameParts[0] ?: 'Google';
                $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : 'User';

                $user = User::create([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'username' => $this->uniqueUsername($email),
                    'email' => $email,
                    'email_verified_at' => now(),
                    'avatar' => $googleUser->getAvatar(),
                    'status' => 'active',
                    'password' => Str::password(48),
                ]);

                $user->assignRole(UserRole::STUDENT->value);
                $this->studentSettingsService->initializeFor($user);
            }

            $exchangeCode = Str::random(64);
            Cache::put("google-auth:{$exchangeCode}", $user->id, now()->addMinutes(2));

            return redirect()->away("{$frontendUrl}/auth/google/callback?code={$exchangeCode}");
        } catch (Throwable) {
            return redirect()->away("{$frontendUrl}/login?google_error=authentication_failed");
        }
    }

    public function exchange(Request $request): JsonResponse
    {
        $validated = $request->validate(['code' => ['required', 'string', 'size:64']]);
        $userId = Cache::pull("google-auth:{$validated['code']}");

        if (! $userId || ! $user = User::find($userId)) {
            return $this->error('This Google sign-in link has expired. Please try again.', 422);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->success(
            new AuthResource(new AuthenticationResult($user, $token)),
            'Google sign-in successful.',
        );
    }

    private function uniqueUsername(string $email): string
    {
        $base = Str::limit(Str::slug(Str::before($email, '@'), '_'), 22, '');
        $base = $base !== '' ? $base : 'student';
        $username = $base;
        $suffix = 1;

        while (User::withTrashed()->where('username', $username)->exists()) {
            $username = Str::limit($base, 26 - strlen((string) $suffix), '') . '_' . $suffix;
            $suffix++;
        }

        return $username;
    }
}
