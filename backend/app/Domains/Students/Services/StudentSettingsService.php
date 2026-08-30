<?php

namespace App\Domains\Students\Services;

use App\Domains\Students\Models\StudentLearningPreference;
use App\Domains\Students\Models\StudentNotificationSetting;
use App\Domains\Students\Models\StudentPrivacySetting;
use App\Domains\Students\Models\StudentSetting;
use App\Domains\Students\Models\StudentSecuritySetting;
use App\Domains\Students\Models\StudentAssessmentPreference;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StudentSettingsService
{
    /**
     * Default settings for a new student.
     */
    public function defaultSettings(): array
    {
        return [
            'account' => [
                'language' => 'en',
                'timezone' => 'Africa/Algiers',
            ],

            'appearance' => [
                'appearance' => 'system',
                'theme' => 'default',
                'compact_mode' => false,
                'reduced_motion' => false,
            ],

            'notifications' => [
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
            ],

            'privacy' => [
                'profile_visibility' => 'private',
                'show_learning_activity' => false,
                'show_achievements' => true,
                'show_certificates' => true,
                'show_course_progress' => false,
                'allow_personalized_recommendations' => true,
                'allow_analytics' => true,
            ],

            'learning' => [
                'preferred_content_language' => 'en',
                'difficulty_preference' => 'adaptive',

                'autoplay_lessons' => true,
                'resume_last_position' => true,
                'show_completed_lessons' => true,
                'show_quiz_explanations' => true,
                'confirm_before_quiz_submit' => true,

                'daily_learning_goal_minutes' => 30,
                'weekly_learning_goal_minutes' => 180,

                'preferred_learning_days' => null,
                'preferred_learning_start_time' => null,
                'preferred_learning_end_time' => null,
            ],
        ];
    }

    /**
     * Create default settings for a newly registered student.
     *
     * Safe to call multiple times.
     */
    public function initializeFor(User $user): void
    {
        DB::transaction(function () use ($user) {
            $defaults = $this->defaultSettings();

            StudentSetting::firstOrCreate(
                ['user_id' => $user->id],
                array_merge(
                    $defaults['account'],
                    $defaults['appearance'],
                ),
            );

            StudentNotificationSetting::firstOrCreate(
                ['user_id' => $user->id],
                $defaults['notifications'],
            );

            StudentPrivacySetting::firstOrCreate(
                ['user_id' => $user->id],
                $defaults['privacy'],
            );

            StudentLearningPreference::firstOrCreate(
                ['user_id' => $user->id],
                $defaults['learning'],
            );
            StudentSecuritySetting::firstOrCreate(['user_id' => $user->id]);
            StudentAssessmentPreference::firstOrCreate(['user_id' => $user->id]);
        });
    }

    /**
     * Retrieve all student settings.
     *
     * If settings do not exist yet, create them automatically.
     */
    public function getFor(User $user): array
    {
        $this->initializeFor($user);

        return [
            'account' => $user->studentSetting()->first(),
            'appearance' => $user->studentSetting()->first(),

            'notifications' =>
                $user->studentNotificationSetting()->first(),

            'privacy' =>
                $user->studentPrivacySetting()->first(),

            'learning' =>
                $user->studentLearningPreference()->first(),
            'security' => $user->studentSecuritySetting()->first(),
            'assessment' => $user->studentAssessmentPreference()->first(),
        ];
    }

    /**
     * Update account and appearance settings.
     */
    public function update(
        User $user,
        array $data,
    ): StudentSetting {
        $defaults = $this->defaultSettings();

        $settings = $user->studentSetting()->firstOrCreate(
            [],
            array_merge(
                $defaults['account'],
                $defaults['appearance'],
            ),
        );

        /*
         * Only allow fields belonging to student_settings.
         *
         * Notifications, privacy and learning preferences
         * have their own tables and services/endpoints.
         */
        $allowed = [
            'language',
            'timezone',
            'appearance',
            'theme',
            'compact_mode',
            'reduced_motion',
        ];

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
