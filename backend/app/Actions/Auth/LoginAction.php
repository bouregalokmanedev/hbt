<?php

namespace App\Actions\Auth;

use App\DTOs\Auth\LoginData;
use App\DTOs\Auth\Results\AuthenticationResult;
use App\Models\User;
use App\Support\ActionResult;
use Illuminate\Support\Facades\Hash;

final readonly class LoginAction
{
    public function execute(LoginData $dto): ActionResult
    {
        $user = User::where('email', $dto->email)->first();

        if (! $user) {
            return ActionResult::failure('Invalid credentials.');
        }

        if (! Hash::check($dto->password, $user->password)) {
            return ActionResult::failure('Invalid credentials.');
        }

        if ($user->status !== 'active') {
            return ActionResult::failure('Your account is inactive.');
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return ActionResult::success(

            new AuthenticationResult(

                user: $user,

                token: $token,

            ),

            'Login successful.'

        );
    }
}