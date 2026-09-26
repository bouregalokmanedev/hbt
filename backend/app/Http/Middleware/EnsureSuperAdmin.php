<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(
            $request->user()?->hasRole(UserRole::SUPER_ADMIN->value),
            403,
            'Super Admin access required.',
        );

        return $next($request);
    }
}
