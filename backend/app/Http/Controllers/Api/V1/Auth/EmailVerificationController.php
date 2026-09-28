<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;
use App\Models\User;
use App\Enums\UserStatus;
use Illuminate\Support\Facades\URL;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use App\Services\Security\AuthenticationLogService;

class EmailVerificationController extends Controller
{
    public function __construct(
    private AuthenticationLogService $authenticationLogService,
) {}
    use ApiResponse;

    public function verify(Request $request, $id, $hash): JsonResponse|RedirectResponse
{
    if (! $request->hasValidSignature()) {
        return $this->verificationOutcome(
            $request,
            false,
            'Invalid or expired verification link.'
        );
    }

    $user = User::findOrFail($id);

    if (! hash_equals(
        sha1($user->getEmailForVerification()),
        $hash
    )) {
        return $this->verificationOutcome(
            $request,
            false,
            'Invalid verification hash.'
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

    return $this->verificationOutcome(
        $request,
        true,
        'Email verified successfully.'
    );
}

    /**
     * The link is opened from the verification email, so browsers get sent
     * straight into the app: `/login?verified=1` lands signed-in sessions on
     * their dashboard (GuestGuard) and shows the success note otherwise.
     * API clients keep the JSON contract.
     */
    private function verificationOutcome(
        Request $request,
        bool $verified,
        string $message
    ): JsonResponse|RedirectResponse {
        if ($request->wantsJson()) {
            return $verified
                ? $this->success(null, $message)
                : $this->error($message, 403);
        }

        $query = $verified ? 'verified=1' : 'verify=error';

        return redirect()->away(
            rtrim(config('app.frontend_url'), '/') . '/login?' . $query
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

    public function resendForEmail(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', strtolower($data['email']))->first();

        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();

            $this->authenticationLogService->log(
                event: 'email.verification_resent',
                successful: true,
                user: $user,
                email: $user->email,
                request: $request,
            );
        }

        // Uniform response so this endpoint cannot be used to probe accounts.
        return $this->success(
            null,
            'If this email needs verification, a new link has been sent.'
        );
    }
}