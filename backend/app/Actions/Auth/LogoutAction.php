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
        auth()->user()->currentAccessToken()->delete();
        $this->authenticationLogService->log(

    event: 'logout',

    successful: true,

    user: $user,

    email: $user->email,

    request: request(),

);


        return ActionResult::success(
            null,
            'Logged out successfully.'
        );
    }
}