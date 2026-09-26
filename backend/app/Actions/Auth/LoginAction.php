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
use App\Services\Security\OtpService;
use App\Notifications\TwoFactorCodeNotification;
use App\Services\Security\TwoFactorDeliveryService;



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

    $this->evaluateBruteForce($dto->email);

    return ActionResult::failure(
        'Email or password is incorrect.',
        code: 'invalid_credentials'
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

    $this->evaluateBruteForce($dto->email);

    return ActionResult::failure(
        'Email or password is incorrect.',
        code: 'invalid_credentials'
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
        'Please verify your email address.',
        code: 'email_not_verified'
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
        'Your account is inactive.',
        code: 'account_inactive'
    );
}
        $security = $user->studentSecuritySetting()->first();
        if ($security?->two_factor_enabled && $security->two_factor_verified_at) {
            $otp = app(OtpService::class)->generate($user, 'two_factor_login');
            $method = $security->two_factor_method ?? 'email';
            app(TwoFactorDeliveryService::class)->send($user, $otp['code'], $method);
            $this->authenticationLogService->log('login.mfa_challenge', true, $user, $dto->email, request());
            return ActionResult::failure(
                'Two-factor verification is required. A six-digit code was sent to your '.($method === 'phone' ? 'phone number' : 'email').'.',
                code: 'requires_two_factor'
            );
        }
        
        $newToken = $user->createToken($dto->remember ? 'auth_token_remember' : 'auth_token');

$this->sessionService->create(
    $user,
    $newToken->accessToken,
    request()
);

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

    private function evaluateBruteForce(string $email): void
    {
        try {
            app(\App\Domains\Security\Services\BruteForceDetectionService::class)
                ->evaluate(request(), $email, false);
        } catch (\Throwable) {
            // Detection must never block the login path.
        }
    }
}
