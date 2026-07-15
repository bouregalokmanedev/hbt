<?php

namespace App\Actions\Auth;

use App\DTOs\Auth\ForgotPasswordData;
use App\Support\ActionResult;
use Illuminate\Support\Facades\Password;

final class ForgotPasswordAction
{
    public function execute(
        ForgotPasswordData $dto
    ): ActionResult {

        $status = Password::sendResetLink([

            'email' => $dto->email,

        ]);

        if ($status !== Password::RESET_LINK_SENT) {

            return ActionResult::failure(
                __($status)
            );
        }

        return ActionResult::success(
            null,
            __($status)
        );
    }
}