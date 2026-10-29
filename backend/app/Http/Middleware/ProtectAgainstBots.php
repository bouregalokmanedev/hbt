<?php

namespace App\Http\Middleware;

use App\Services\Security\BotProtectionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class ProtectAgainstBots
{
    public function __construct(
        private readonly BotProtectionService $bots,
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $this->bots->verify($request);

        return $next($request);
    }
}
