<?php

namespace App\Services\Security;

use App\Models\User;
use App\Notifications\TwoFactorCodeNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

final class TwoFactorDeliveryService
{
    public function send(User $user, string $code, string $method): void
    {
        if ($method === 'email') {
            $user->notify(new TwoFactorCodeNotification($code));
            return;
        }

        if (! $user->phone) {
            throw ValidationException::withMessages(['phone' => 'Add and verify a phone number before using SMS two-factor authentication.']);
        }

        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.from');
        if (! $sid || ! $token || ! $from) {
            throw ValidationException::withMessages(['method' => 'SMS two-factor authentication is not configured. Add Twilio credentials to enable it.']);
        }

        $response = Http::asForm()->withBasicAuth($sid, $token)->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
            'To' => $user->phone,
            'From' => $from,
            'Body' => "Your HBT Learning verification code is {$code}. It expires in 10 minutes.",
        ]);

        if ($response->failed()) {
            throw ValidationException::withMessages(['phone' => 'We could not send an SMS to this phone number. Please check it and try again.']);
        }
    }
}
