<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TwoFactorCodeNotification extends Notification
{
    use Queueable;
    public function __construct(private readonly string $code) {}
    public function via(object $notifiable): array { return ['mail']; }
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)->subject('Confirm two-factor authentication')
            ->line("Your HBT Learning security code is {$this->code}.")
            ->line('This code expires in 10 minutes. Do not share it with anyone.');
    }
}
