<?php

namespace App\Domains\Students\Services;

use App\Domains\Students\Models\StudentLearningPreference;
use App\Models\User;

class StudentLearningPreferenceService
{
    public function update(
        User $user,
        array $data,
    ): StudentLearningPreference {
        $settings = $user->studentLearningPreference()->firstOrCreate(
            [],
            [
                'preferred_content_language' => 'en',
                'difficulty_preference' => 'adaptive',

                'autoplay_lessons' => true,
                'resume_last_position' => true,
                'show_completed_lessons' => true,
                'show_quiz_explanations' => true,
                'confirm_before_quiz_submit' => true,

                'daily_learning_goal_minutes' => 30,
                'weekly_learning_goal_minutes' => 180,
            ],
        );

        $allowed = [
            'preferred_content_language',
            'difficulty_preference',

            'autoplay_lessons',
            'resume_last_position',
            'show_completed_lessons',
            'show_quiz_explanations',
            'confirm_before_quiz_submit',

            'daily_learning_goal_minutes',
            'weekly_learning_goal_minutes',
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