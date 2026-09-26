<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Notifications\TwoFactorCodeNotification;
use App\Services\Security\OtpService;
use App\Services\Security\TwoFactorDeliveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PhoneVerificationController extends Controller
{
    use ApiResponse;

    /**
     * Send a six-digit code to the phone number saved on the profile.
     *
     * SMS goes out through Twilio when credentials are configured; otherwise
     * the code is delivered by email so verification is always possible.
     */
    public function send(
        Request $request,
        OtpService $otp,
        TwoFactorDeliveryService $delivery,
    ): JsonResponse {
        $user = $request->user();

        abort_unless(
            filled($user->phone),
            422,
            'Add a phone number to your profile before requesting a verification code.'
        );

        if ($user->phone_verified_at) {
            return $this->success(
                [
                    'delivery' => null,
                    'phone_verified_at' => $user->phone_verified_at->toISOString(),
                ],
                'This phone number is already verified.'
            );
        }

        $generated = $otp->generate($user, 'phone_verification');
        $method = $this->smsConfigured() ? 'sms' : 'email';

        try {
            $delivery->send($user, $generated['code'], $method);
        } catch (ValidationException) {
            $method = 'email';
            $user->notify(new TwoFactorCodeNotification($generated['code']));
        }

        return $this->success(
            ['delivery' => $method],
            $method === 'sms'
                ? 'A verification code was sent by SMS.'
                : 'A verification code was sent to your email.'
        );
    }

    /**
     * Confirm the code and mark the stored phone number as verified.
     */
    public function verify(Request $request, OtpService $otp): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'digits:6'],
        ]);

        $user = $request->user();

        abort_unless(
            filled($user->phone),
            422,
            'Add a phone number to your profile before verifying.'
        );

        abort_unless(
            $otp->verify($user, 'phone_verification', $data['code']),
            422,
            'That verification code is invalid or expired.'
        );

        $user->forceFill(['phone_verified_at' => now()])->save();

        return $this->success(
            ['phone_verified_at' => $user->phone_verified_at->toISOString()],
            'Phone number verified.'
        );
    }

    private function smsConfigured(): bool
    {
        return filled(config('services.twilio.sid'))
            && filled(config('services.twilio.token'))
            && filled(config('services.twilio.from'));
    }
}
