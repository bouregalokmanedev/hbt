<?php

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Notification;

it('sends a branded notification-style reset password email', function () {
    Notification::fake();

    $user = User::factory()->create([
        'first_name' => 'Sara',
        'email' => 'sara@example.com',
    ]);

    $user->notify(new ResetPasswordNotification('test-token'));

    Notification::assertSentTo(
        $user,
        ResetPasswordNotification::class,
        function (ResetPasswordNotification $notification, array $channels) use ($user) {
            expect($channels)->toContain('mail');

            $mail = $notification->toMail($user);

            expect($mail->subject)->toBe('Reset your password - HBTronics')
                ->and($mail->view)->toBe('emails.reset-password')
                ->and($mail->viewData['resetUrl'])->toBe(
                    config('app.frontend_url')
                        . '/reset-password?token=test-token&email='
                        . urlencode($user->email)
                )
                ->and($mail->viewData['expiresIn'])
                    ->toBe((int) config('auth.passwords.users.expire', 60))
                ->and($mail->viewData['user']->id)->toBe($user->id);

            return true;
        },
    );
});

it('renders the reset password notification template with house branding', function () {
    $user = User::factory()->make([
        'first_name' => 'Sara',
        'email' => 'sara@example.com',
    ]);

    $html = view('emails.reset-password', [
        'user' => $user,
        'resetUrl' => 'http://localhost:5173/reset-password?token=abc&email=sara%40example.com',
        'expiresIn' => 60,
    ])->render();

    expect($html)
        ->toContain('Security notification')
        ->toContain('Reset your password')
        ->toContain('Hello Sara')
        ->toContain('sara@example.com')
        ->toContain('http://localhost:5173/reset-password?token=abc&amp;email=sara%40example.com')
        ->toContain('Reset Password')
        ->toContain('60 minutes')
        ->toContain('HBTronics Learning Platform')
        ->toContain('#F47822')
        ->toContain('Learn. Diagnose. Master.');
});
