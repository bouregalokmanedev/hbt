<?php

namespace App\Actions\Auth;

use App\DTOs\Auth\ForgotPasswordData;
use App\Support\ActionResult;
use Illuminate\Support\Facades\Password;

final class ForgotPasswordAction
{
    /**
     * Always return the same success payload so callers cannot
     * distinguish registered vs unknown emails (enumeration).
     */
    public function execute(
        ForgotPasswordData $dto
    ): ActionResult {
        Password::sendResetLink([
            'email' => $dto->email,
        ]);

        return ActionResult::success(
            null,
            'If an account exists for that email, a password reset link has been sent.'
        );
    }
}
