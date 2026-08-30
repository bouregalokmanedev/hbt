<?php

namespace App\Domains\Students\Services;

use App\Domains\Students\Models\StudentPrivacySetting;
use App\Models\User;

class StudentPrivacySettingsService
{
    public function update(
        User $user,
        array $data,
    ): StudentPrivacySetting {
        $settings = $user->studentPrivacySetting()->firstOrCreate(
            [],
            [
                'profile_visibility' => 'private',
                'show_learning_activity' => false,
                'show_achievements' => true,
                'show_certificates' => true,
                'show_course_progress' => false,
                'allow_personalized_recommendations' => true,
                'allow_analytics' => true,
            ],
        );

        $settings->fill($data);
        $settings->save();

        return $settings->refresh();
    }
}