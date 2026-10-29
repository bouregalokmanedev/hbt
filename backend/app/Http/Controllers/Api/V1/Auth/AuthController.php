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
use App\Http\Requests\Api\V1\ResetPasswordRequest;
use App\Models\User;
use App\Actions\Users\UpdateUserAction;
use App\Http\Requests\Api\V1\Auth\UpdateProfileRequest;
use Illuminate\Http\Request;
use App\Services\Security\OtpService;
use App\Services\Security\TwoFactorChallengeService;
use App\Services\Security\TwoFactorDeliveryService;
use App\Services\Session\SessionService;
use App\Services\Security\AuthenticationLogService;
use App\Enums\UserStatus;
use App\DTOs\Auth\Results\AuthenticationResult;
use Illuminate\Support\Facades\DB;



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

    $code = $result->code;

    // Machine-readable 2FA challenge: the login page keys the six-digit
    // form off `requires_two_factor` instead of sniffing message text.
    if ($code === 'requires_two_factor' || str_contains($result->message, 'Two-factor verification is required')) {
        return response()->json([
            'success' => false,
            'message' => $result->message,
            'requires_two_factor' => true,
            'code' => $code ?? 'requires_two_factor',
            'challenge_token' => $result->data['challenge_token'] ?? null,
            'expires_in' => $result->data['expires_in'] ?? null,
            'errors' => [],
        ], 423);
    }

    if ($code === null) {
        $code = str_contains($result->message, 'Too many login attempts')
            ? 'rate_limited'
            : 'invalid_credentials';
    }

    $status = $code === 'rate_limited'
        ? 429
        : 401;

    return response()->json([
        'success' => false,
        'message' => $result->message,
        'code' => $code,
        'errors' => [],
    ], $status);
}

    return $this->success(
        new AuthResource($result->data),
        $result->message
    );
}

public function verifyTwoFactorLogin(Request $request, OtpService $otp, TwoFactorChallengeService $challenges, SessionService $sessions, AuthenticationLogService $logs): JsonResponse
{
    $data = $request->validate([
        'email' => ['required', 'email'],
        'code' => ['required', 'digits:6'],
        'challenge_token' => ['required', 'string', 'size:64'],
    ]);

    $user = User::where('email', strtolower($data['email']))->first();

    /*
     * A valid OTP must never be enough on its own. The challenge token is
     * only issued after the password check and is bound to this account.
     * All failure modes share one message to avoid account enumeration.
     */
    abort_unless(
        $user
        && $user->status === UserStatus::ACTIVE->value
        && $user->hasVerifiedEmail()
        && $user->studentSecuritySetting?->two_factor_enabled,
        422,
        'That verification code is invalid or expired.',
    );

    $challenge = $challenges->findActiveFor($user, $data['challenge_token']);

    abort_unless(
        $challenge,
        422,
        'Your verification session has expired. Please sign in again.',
    );

    $verified = DB::transaction(function () use ($challenges, $otp, $user, $challenge, $data): bool {
        $locked = $challenges->lockActive($challenge);

        if (! $locked) {
            return false;
        }

        if (! $otp->verify($user, 'two_factor_login', $data['code'])) {
            $challenges->recordFailure($locked);

            return false;
        }

        return $challenges->consume($locked);
    });

    abort_unless($verified, 422, 'That verification code is invalid or expired.');

    $token = $user->createToken('auth_token');
    $sessions->create($user, $token->accessToken, $request);
    $logs->log('login.success', true, $user, $user->email, $request, metadata: ['mfa' => true]);
    return $this->success(new AuthResource(new AuthenticationResult($user, $token->plainTextToken)), 'Two-factor verification successful.');
}

public function resendTwoFactorLogin(Request $request, OtpService $otp, TwoFactorChallengeService $challenges, TwoFactorDeliveryService $delivery, AuthenticationLogService $logs): JsonResponse
{
    $data = $request->validate([
        'email' => ['required', 'email'],
        'challenge_token' => ['required', 'string', 'size:64'],
    ]);

    $user = User::where('email', strtolower($data['email']))->first();
    $challenge = $user
        ? $challenges->findActiveFor($user, $data['challenge_token'])
        : null;
    $security = $user?->studentSecuritySetting;

    abort_unless(
        $user
        && $challenge
        && $user->status === UserStatus::ACTIVE->value
        && $user->hasVerifiedEmail()
        && $security?->two_factor_enabled
        && $security->two_factor_verified_at,
        422,
        'Your verification session has expired. Please sign in again.',
    );

    $generated = $otp->generate($user, 'two_factor_login');
    $delivery->send($user, $generated['code'], $security->two_factor_method ?? 'email');
    $logs->log('login.mfa_challenge', true, $user, $user->email, $request);
    return $this->success(['resent' => true], 'A new six-digit code was sent.');
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
