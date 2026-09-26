<?php

namespace App\Http\Middleware;

use App\Domains\Security\ValueObjects\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $context = TenantContext::fromUser($user);

        $request->attributes->set('tenant_context', $context);

        // Bind for container resolution where needed
        app()->instance(TenantContext::class, $context);

        return $next($request);
    }
}
