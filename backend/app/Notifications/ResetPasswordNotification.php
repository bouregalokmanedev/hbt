<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $url = config('app.frontend_url')
            . '/reset-password?token='
            . $this->token
            . '&email='
            . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Reset your password - HBTronics')
            ->view('emails.reset-password', [
                'user' => $notifiable,
                'resetUrl' => $url,
                'expiresIn' => (int) config('auth.passwords.users.expire', 60),
            ]);
    }
}
