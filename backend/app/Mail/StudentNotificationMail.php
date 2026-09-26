<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class StudentNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly string $appTitle,
        public readonly string $notifyTitle,
        public readonly string $notifyMessage,
        public readonly ?string $actionUrl,
        public readonly string $firstName = '',
        public readonly string $type = 'notification',
    ) {
        $this->onQueue('notifications');
    }

    public function envelope(): Envelope
    {
        $greeting = $this->firstName !== ''
            ? "{$this->firstName} — {$this->notifyTitle}"
            : $this->notifyTitle;

        return new Envelope(
            subject: "[{$this->appTitle}] {$greeting}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.student-notification',
            with: [
                'appTitle' => $this->appTitle,
                'notifyTitle' => $this->notifyTitle,
                'notifyMessage' => $this->notifyMessage,
                'actionUrl' => $this->actionUrl,
                'firstName' => $this->firstName,
                'type' => $this->type,
                'eyebrow' => $this->eyebrow(),
            ],
        );
    }

    private function eyebrow(): string
    {
        return match ($this->type) {
            'lesson_completed', 'course_completed', 'section_completed' => 'Milestone reached',
            'learning_streak', 'streak_nudge', 'level_up', 'achievement' => 'Keep the momentum',
            'weekly_activity' => 'Your week in review',
            'certificate', 'certificate_issued' => 'Certificate earned',
            'assessment', 'assessment_passed', 'assessment_submitted', 'assessment_ready' => 'Assessment update',
            'security' => 'Security notification',
            'announcement', 'course', 'course_updates', 'enrollment' => 'Course update',
            default => 'Notification',
        };
    }
}
