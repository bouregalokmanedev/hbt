<?php

namespace App\Http\Controllers\Api\V1\Auth;


use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\RegisterRequest;
use App\Http\Resources\Api\V1\Auth\AuthResource;
use App\Http\Responses\ApiResponse;
use App\Services\Authentication\AuthenticationService;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Actions\Auth\ForgotPasswordAction;
use App\Http\Requests\Api\V1\ForgotPasswordRequest;
use App\Http\Requests\Api\V1\resetPasswordRequest;
use App\Models\User;
use App\Enums\UserStatus;
use App\Actions\Users\UpdateUserAction;
use App\Http\Requests\Api\V1\Auth\UpdateProfileRequest;
use Illuminate\Http\Request;
use App\Services\Security\OtpService;
use App\Services\Session\SessionService;
use App\Services\Security\AuthenticationLogService;
use App\DTOs\Auth\Results\AuthenticationResult;



class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly AuthenticationService $auth,
    private readonly UpdateUserAction $updateUser,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->auth->register(
            $request->dto()
        );

        if (! $result->success) {
            return $this->error(
                $result->message,
                422,
                $result->errors ?? []
            );
        }

        return $this->success(
            new AuthResource($result->data),
            $result->message,
            201
        );
    }

public function login(LoginRequest $request): JsonResponse
{
    $result = $this->auth->login(
        $request->dto()
    );

    if (! $result->success) {

    $status = str_contains(
        $result->message,
        'Too many login attempts'
    )
        ? 429
        : 401;

    return $this->error(
        $result->message,
        $status
    );
}

    return $this->success(
        new AuthResource($result->data),
        $result->message
    );
}

public function verifyTwoFactorLogin(Request $request, OtpService $otp, SessionService $sessions, AuthenticationLogService $logs): JsonResponse
{
    $data = $request->validate(['email' => ['required', 'email'], 'code' => ['required', 'digits:6']]);
    $user = User::where('email', strtolower($data['email']))->first();
    abort_unless($user && $user->studentSecuritySetting?->two_factor_enabled, 422, 'Two-factor authentication is not enabled for this account.');
    abort_unless($otp->verify($user, 'two_factor_login', $data['code']), 422, 'That verification code is invalid or expired.');
    $token = $user->createToken('auth_token');
    $sessions->create($user, $token->accessToken, $request);
    $logs->log('login.success', true, $user, $user->email, $request, metadata: ['mfa' => true]);
    return $this->success(new AuthResource(new AuthenticationResult($user, $token->plainTextToken)), 'Two-factor verification successful.');
}

public function verify(
    EmailVerificationRequest $request
): JsonResponse {

    $user = User::findOrFail(
        $request->route('id')
    );

    if (! $user->hasVerifiedEmail()) {
        $user->markEmailAsVerified();
    }

    $user->update([
        'status' => UserStatus::ACTIVE->value,
    ]);

    return $this->success(
        null,
        'Email verified successfully.'
    );
}

public function updateProfile(
    UpdateProfileRequest $request
): JsonResponse {
    $user = $this->updateUser->execute(
        $request->user(),
        $request->dto()
    );

    if (filled($user->first_name) && filled($user->last_name) && filled($user->username) && filled($user->phone) && filled($user->country) && filled($user->bio)) {
        app(\App\Domains\Progression\Services\StudentProgressionService::class)->award($user, 'profile_completed', 25, 40, 'profile-completed', ['label' => 'Profile completed']);
    }

    return $this->success(
        new UserResource($user),
        'Profile updated successfully.'
    );
}

public function logout(): JsonResponse
{
    $result = $this->auth->logout();

    return $this->success(
        null,
        $result->message
    );
}
public function me(): JsonResponse
{
    return $this->success(
        new UserResource(auth()->user())
    );
}

public function forgotPassword(
    ForgotPasswordRequest $request
): JsonResponse {

    $result = $this->auth
        ->forgotPassword(
            $request->dto()
        );

    if (! $result->success) {

        return $this->error(
            $result->message,
            422
        );

    }

    return $this->success(
        null,
        $result->message
    );
}

public function resetPassword(
    ResetPasswordRequest $request
): JsonResponse
{
    $result = $this->auth
        ->resetPassword(
            $request->dto()
        );

    if (! $result->success) {

        return $this->error(
            $result->message,
            422
        );

    }

    return $this->success(
        null,
        $result->message
    );
}
}
