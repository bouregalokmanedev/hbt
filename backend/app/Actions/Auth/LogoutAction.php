<?php

namespace App\Actions\Auth;

use App\Support\ActionResult;
use App\Services\Security\AuthenticationLogService;

final class LogoutAction
{
    public function __construct(
    private AuthenticationLogService $authenticationLogService,
) {}
    public function execute(): ActionResult
    {
        $user = auth()->user();
        $this->authenticationLogService->log(

    event: 'logout',

    successful: true,

    user: $user,

    email: $user->email,

    request: request(),

);
$user->currentAccessToken()?->delete();

        return ActionResult::success(
            null,
            'Logged out successfully.'
        );
    }
}