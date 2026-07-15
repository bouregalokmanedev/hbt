<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\JsonResponse;
use App\Enums\UserStatus;

class EmailVerificationController extends Controller
{
    use ApiResponse;

    

public function verify(
    EmailVerificationRequest $request
): JsonResponse {

    $request->fulfill();

    $user = $request->user();

    $user->update([
        'status' => UserStatus::ACTIVE->value,
    ]);

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