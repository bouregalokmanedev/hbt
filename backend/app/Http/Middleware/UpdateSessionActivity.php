<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\UserSession;

class UpdateSessionActivity
{
    public function handle($request, Closure $next)
    {
        if ($request->user()) {

            $token = $request->user()->currentAccessToken();

            if ($token) {

                UserSession::where(
                    'token_id',
                    $token->id
                )->update([

                    'last_activity_at' => now(),

                ]);

            }

        }

        return $next($request);
    }
}