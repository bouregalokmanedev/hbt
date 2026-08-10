<?php

namespace App\Actions\Auth;

use App\Support\ActionResult;
use App\Services\Security\AuthenticationLogService;
use App\Services\Session\SessionService;

final class LogoutAction
{
    public function __construct(
        private AuthenticationLogService $authenticationLogService,
        private SessionService $sessionService,
    ) {}

    public function execute(): ActionResult
    {
        $user = auth()->user();

        $token = $user->currentAccessToken();

        if ($token) {
            $session = $user->sessions()
                ->where('token_id', $token->id)
                ->first();

            if ($session) {
                $this->sessionService->logout($session);
            } else {
                $token->delete();
            }
        }

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