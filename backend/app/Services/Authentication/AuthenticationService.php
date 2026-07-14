<?php

namespace App\Services\Authentication;

use App\Actions\Auth\RegisterAction;
use App\DTOs\Auth\RegisterData;
use App\Support\ActionResult;
use Illuminate\Auth\Events\Registered;
use App\DTOs\Auth\Results\AuthenticationResult;

use App\Actions\Auth\LogoutAction;
use App\Services\Security\LoginThrottleService;



final readonly class AuthenticationService
{
    public function __construct(
    private RegisterAction $registerAction,
    private LoginAction $loginAction,
    private LogoutAction $logoutAction,
    private LoginThrottleService $throttle,
) {}


    public function register(RegisterData $dto): ActionResult
    {
        $result = $this->registerAction->execute($dto);

        if (! $result->success) {
            return $result;
        }

        $user = $result->data;

        // Email verification
        event(new Registered($user));

        // Sanctum Token
        $token = $user->createToken('auth_token')->plainTextToken;

        

return ActionResult::success(

    new AuthenticationResult(

        user: $user->fresh(),

        token: $token,

        tokenType: 'Bearer',

        expiresAt: null,

    ),

    'Registration successful.'

);
    }

    public function login(LoginData $dto): ActionResult
{
    $ip = request()->ip();

    if ($this->throttle->tooManyAttempts($dto->email, $ip)) {

        return ActionResult::failure(
            'Too many login attempts. Try again in '.$this->throttle->availableIn($dto->email, $ip).' seconds.'
        );

    }

    $result = $this->loginAction->execute($dto);

    if (! $result->success) {

        $this->throttle->hit(
            $dto->email,
            $ip
        );

        return $result;
    }

    $this->throttle->clear(
        $dto->email,
        $ip
    );

    return $result;
}

public function logout(): ActionResult
{
    return $this->logoutAction->execute();
}
}