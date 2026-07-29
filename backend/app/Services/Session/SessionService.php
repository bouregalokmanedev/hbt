<?php

namespace App\Services\Session;

use App\Models\User;
use App\Models\UserSession;
use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;
use Laravel\Sanctum\PersonalAccessToken;


class SessionService
{
    public function create(
        User $user,
        PersonalAccessToken $token,
        Request $request
    ): UserSession {

        $device = $this->deviceDetector
    ->detect($request);

        return UserSession::create([

            'user_id' => $user->id,

            'token_id' => $token->id,

            'device_name' => $agent->device(),

            'browser' => $agent->browser(),

            'platform' => $agent->platform(),

            'device_type' => $this->deviceType($agent),

            'ip_address' => $request->ip(),

            'user_agent' => $request->userAgent(),

            'logged_in_at' => now(),

            'last_activity_at' => now(),

            'is_current' => true,

        ]);
    }

    private function deviceType(Agent $agent): string
    {
        return match (true) {

            $agent->isDesktop() => 'desktop',

            $agent->isPhone() => 'phone',

            $agent->isTablet() => 'tablet',

            default => 'unknown',

        };
    }

    public function all(User $user)
{
    return $user->sessions()
        ->latest('last_activity_at')
        ->get();
}

public function current(User $user): ?UserSession
{
    $token = $user->currentAccessToken();

    if (! $token) {
        return null;
    }

    return UserSession::where(
        'token_id',
        $token->id
    )->first();
}
public function logout(UserSession $session): void
{
    if ($session->token_id) {

        PersonalAccessToken::where(
            'id',
            $session->token_id
        )->delete();

    }

    $session->update([

        'logged_out_at' => now(),

        'is_current' => false,

    ]);
}
public function logoutOthers(User $user): void
{
    $currentToken = $user
        ->currentAccessToken();

    $sessions = $user->sessions()
        ->where('token_id', '!=', $currentToken->id)
        ->get();

    foreach ($sessions as $session) {

        $this->logout($session);

    }
}

}