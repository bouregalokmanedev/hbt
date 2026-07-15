<?php

namespace App\Actions\Auth;

use App\DTOs\Auth\ResetPasswordData;
use App\Support\ActionResult;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

final class ResetPasswordAction
{
    public function execute(
        ResetPasswordData $dto
    ): ActionResult {

        $status = Password::reset(

            [

                'email' => $dto->email,

                'password' => $dto->password,

                'password_confirmation' => $dto->password,

                'token' => $dto->token,

            ],

            function ($user) use ($dto) {

                $user->forceFill([

                    'password' => Hash::make($dto->password),

                    'remember_token' => Str::random(60),

                ])->save();

                /*
                 * Security Improvement
                 * Logout every device
                 */

                $user->tokens()->delete();

                event(new PasswordReset($user));

            }

        );

        if ($status !== Password::PASSWORD_RESET) {

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