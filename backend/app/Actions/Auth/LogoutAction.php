<?php

namespace App\Actions\Auth;

use App\Support\ActionResult;

final class LogoutAction
{
    public function execute(): ActionResult
    {
        auth()->user()->currentAccessToken()->delete();

        return ActionResult::success(
            null,
            'Logged out successfully.'
        );
    }
}