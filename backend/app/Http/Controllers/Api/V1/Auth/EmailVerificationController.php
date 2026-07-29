<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;
use App\Models\User;
use App\Enums\UserStatus;
use Illuminate\Support\Facades\URL;
use Illuminate\Http\JsonResponse;
use App\Services\Security\AuthenticationLogService;

class EmailVerificationController extends Controller
{
    public function __construct(
    private AuthenticationLogService $authenticationLogService,
) {}
    use ApiResponse;

    public function verify(Request $request, $id, $hash): JsonResponse
{
    $user = User::findOrFail($id);

    if (! $request->hasValidSignature()) {
        return $this->error(
            'Invalid or expired verification link.',
            403
        );
    }

    if (! hash_equals(
        sha1($user->getEmailForVerification()),
        $hash
    )) {
        return $this->error(
            'Invalid verification hash.',
            403
        );
    }

    if (! $user->hasVerifiedEmail()) {

        $user->markEmailAsVerified();

        $user->update([
            'status' => UserStatus::ACTIVE->value,
        ]);

        $this->authenticationLogService->log(

            event: 'email.verified',

            successful: true,

            user: $user,

            email: $user->email,

            request: $request,

        );
    }

    return $this->success(
        null,
        'Email verified successfully.'
    );
}
    public function resend(): JsonResponse
{
    $user = auth()->user();

    if ($user->hasVerifiedEmail()) {

        return $this->success(
            null,
            'Email already verified.'
        );

    }

    $user->sendEmailVerificationNotification();

    return $this->success(
        null,
        'Verification email sent.'
    );
}
}