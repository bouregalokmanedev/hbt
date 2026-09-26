<?php

namespace App\Domains\Notifications\Services;

use App\Domains\Notifications\Models\StudentNotification;
use App\Mail\StudentNotificationMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class StudentNotificationService
{
    /**
     * Map notification types to the per-type student preference column.
     * Unmapped types fall through to "always allow" (only the global
     * email_enabled master switch applies).
     */
    private const EMAIL_TYPE_MAP = [
        'enrollment' => 'course_updates',
        'course' => 'course_updates',
        'course_updates' => 'course_updates',
        'announcement' => 'course_updates',
        'payment' => 'course_updates',
        'weekly_activity' => 'course_updates',
        'streak_nudge' => 'course_updates',

        'lesson' => 'lesson_reminders',
        'lesson_reminder' => 'lesson_reminders',

        'quiz' => 'quiz_reminders',

        'assessment' => 'assessment_results',
        'assessment_ready' => 'assessment_results',
        'assessment_passed' => 'assessment_results',
        'assessment_submitted' => 'assessment_results',

        'certificate' => 'certificate_issued',
        'certificate_issued' => 'certificate_issued',

        'achievement' => 'achievement_unlocked',
        'level_up' => 'achievement_unlocked',
        'learning_streak' => 'achievement_unlocked',

        'course_completed' => 'course_completion',
        'lesson_completed' => 'course_completion',
        'section_completed' => 'course_completion',

        'security' => 'security_alerts',
        'marketing' => 'marketing',
    ];

    public function send(User $user, string $type, string $title, string $message, ?string $actionUrl = null, ?string $dedupeKey = null, ?string $broadcastId = null, ?string $conversationId = null): bool
    {
        $settings = $user->studentNotificationSetting;
        $inAppWanted = $settings?->in_app_enabled !== false;
        $emailWanted = $this->shouldEmail($settings, $type) && filled($user->email);

        if (! $inAppWanted && ! $emailWanted) {
            return false;
        }

        // The row is the delivery ledger: dedupe for both channels.
        // When in-app is off we still create it so email cannot double-send;
        // the notification feed hides rows while in_app_enabled is false.
        $notification = StudentNotification::query()->firstOrCreate(
            ['user_id' => $user->id, 'dedupe_key' => $dedupeKey],
            [
                'admin_broadcast_id' => $broadcastId,
                'message_conversation_id' => $conversationId,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'action_url' => $actionUrl,
            ],
        );

        if (! $notification->wasRecentlyCreated) {
            return false;
        }

        if (! $inAppWanted) {
            // Keep the ledger row for dedupe, but surface it as read so
            // badges/list stay quiet while in-app is disabled.
            $notification->forceFill(['read_at' => now()])->saveQuietly();
        }

        // MAIL_MAILER=log in .env.example logs instead of sending until
        // SMTP credentials are configured for production.
        if ($emailWanted) {
            try {
                Mail::to($user->email)->queue(new StudentNotificationMail(
                    appTitle: (string) config('app.name', 'HBT Learning'),
                    notifyTitle: $title,
                    notifyMessage: $message,
                    actionUrl: $actionUrl,
                    firstName: (string) ($user->first_name ?? ''),
                    type: $type,
                ));
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Student notification email failed: '.$e->getMessage(), ['user_id' => $user->id, 'type' => $type]);
            }
        }

        return true;
    }

    private function shouldEmail(?\App\Domains\Students\Models\StudentNotificationSetting $settings, string $type): bool
    {
        if ($settings === null) {
            // No explicit settings yet -> default to email enabled
            return true;
        }
        if ($settings->email_enabled === false) {
            return false;
        }

        $pref = self::EMAIL_TYPE_MAP[$type] ?? null;
        if ($pref === null) {
            return true;
        }

        return (bool) ($settings->{$pref} ?? true);
    }
}
