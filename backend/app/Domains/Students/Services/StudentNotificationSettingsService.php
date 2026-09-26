<?php

namespace App\Domains\Students\Services;

use App\Domains\Students\Models\StudentNotificationSetting;
use App\Mail\StudentNotificationMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class StudentNotificationSettingsService
{
    /**
     * Default notification settings.
     */
    public function defaults(): array
    {
        return [
            'email_enabled' => true,
            'push_enabled' => true,
            'in_app_enabled' => true,

            'course_updates' => true,
            'lesson_reminders' => true,
            'quiz_reminders' => true,
            'assessment_results' => true,
            'certificate_issued' => true,
            'achievement_unlocked' => true,
            'course_completion' => true,
            'security_alerts' => true,
            'marketing' => false,
        ];
    }

    /**
     * Get notification settings for a student.
     */
    public function getFor(User $user): StudentNotificationSetting
    {
        return $user->studentNotificationSetting()->firstOrCreate(
            [],
            $this->defaults(),
        );
    }

    /**
     * Update notification settings.
     */
    public function update(
        User $user,
        array $data,
    ): StudentNotificationSetting {
        $settings = $this->getFor($user);

        $emailWasEnabled = (bool) $settings->email_enabled;

        $allowed = array_keys($this->defaults());

        $settings->fill(
            array_intersect_key(
                $data,
                array_flip($allowed),
            ),
        );

        $settings->save();
        $settings->refresh();

        // Confirm by email exactly when the student turns email
        // notifications back on — not on every save.
        if (! $emailWasEnabled && (bool) $settings->email_enabled && filled($user->email)) {
            $this->sendEnabledConfirmation($user);
        }

        return $settings;
    }

    private function sendEnabledConfirmation(User $user): void
    {
        $name = trim((string) ($user->first_name ?? ''));

        try {
            Mail::to($user->email)->queue(new StudentNotificationMail(
                appTitle: (string) config('app.name', 'HBT Learning'),
                notifyTitle: 'Email notifications enabled',
                notifyMessage: ($name !== '' ? "Hello {$name}," : 'Hello,')
                    .' email notifications are now enabled on your HBT Learning account. You will receive course updates, assessment results, certificates, and security alerts by email. You can change this anytime in Settings → Notifications.',
                actionUrl: null,
                firstName: $name,
                type: 'security',
            ));
        } catch (\Throwable $e) {
            Log::warning('Notification opt-in confirmation email failed: '.$e->getMessage(), ['user_id' => $user->id]);
        }
    }
}