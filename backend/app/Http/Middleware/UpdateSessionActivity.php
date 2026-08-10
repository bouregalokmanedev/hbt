<?php

namespace App\Http\Middleware;

use App\Models\UserSession;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class UpdateSessionActivity
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        if ($request->user()) {
            $token = $request->user()->currentAccessToken();

            if ($token instanceof PersonalAccessToken) {
                UserSession::where('token_id', $token->id)
                    ->where('user_id', $request->user()->id)
                    ->whereNull('logged_out_at')
                    ->update([
                        'last_activity_at' => now(),
                    ]);
            }
        }

        return $next($request);
    }
}
