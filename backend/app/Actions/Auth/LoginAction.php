<?php

namespace App\Actions\Auth;

use App\DTOs\Auth\LoginData;
use App\DTOs\Auth\Results\AuthenticationResult;
use App\Models\User;
use App\Support\ActionResult;
use Illuminate\Support\Facades\Hash;
use App\Enums\UserStatus;
use App\Services\Session\SessionService;
use App\Services\Security\AuthenticationLogService;



final readonly class LoginAction
{
    public function __construct(
    private SessionService $sessionService,
    private AuthenticationLogService $authenticationLogService,
) {}

    public function execute(LoginData $dto): ActionResult
    {
        $user = User::where('email', $dto->email)->first();

        if (! $user) {

    $this->authenticationLogService->log(

        event: 'login.failed',

        successful: false,

        user: null,

        email: $dto->email,

        request: request(),

        reason: 'Invalid credentials',

    );

    return ActionResult::failure(
        'Invalid credentials.'
    );
}

        if (! Hash::check($dto->password, $user->password)) {

    $this->authenticationLogService->log(

        event: 'login.failed',

        successful: false,

        user: null,

        email: $dto->email,

        request: request(),

        reason: 'Invalid credentials',

    );

    return ActionResult::failure(
        'Invalid credentials.'
    );
}
        if (! $user->hasVerifiedEmail()) {

    $this->authenticationLogService->log(

        event: 'login.failed',

        successful: false,

        user: $user,

        email: $dto->email,

        request: request(),

        reason: 'Email not verified',

    );

    return ActionResult::failure(
        'Please verify your email address.'
    );
}

       if ($user->status !== UserStatus::ACTIVE->value) {

    $this->authenticationLogService->log(

        event: 'login.failed',

        successful: false,

        user: $user,

        email: $dto->email,

        request: request(),

        reason: 'Account inactive',

    );

    return ActionResult::failure(
        'Your account is inactive.'
    );
}
        
        $newToken = $user->createToken('auth_token');
$plainToken = $newToken->plainTextToken;
        $this->authenticationLogService->log(

    event: 'login.success',

    successful: true,

    user: $user,

    email: $dto->email,

    request: request(),

);

        return ActionResult::success(

            new AuthenticationResult(

                user: $user,

                 token: $plainToken,

            ),

            'Login successful.'

        );
    }
}