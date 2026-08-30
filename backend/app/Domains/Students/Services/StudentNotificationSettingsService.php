<?php

namespace App\Domains\Students\Services;

use App\Domains\Students\Models\StudentNotificationSetting;
use App\Models\User;

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

        $allowed = array_keys($this->defaults());

        $settings->fill(
            array_intersect_key(
                $data,
                array_flip($allowed),
            ),
        );

        $settings->save();

        return $settings->refresh();
    }
}