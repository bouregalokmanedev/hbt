<?php

namespace App\Domains\Students\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'email_enabled' => [
                'sometimes',
                'boolean',
            ],

            'push_enabled' => [
                'sometimes',
                'boolean',
            ],

            'in_app_enabled' => [
                'sometimes',
                'boolean',
            ],

            'course_updates' => [
                'sometimes',
                'boolean',
            ],

            'lesson_reminders' => [
                'sometimes',
                'boolean',
            ],

            'quiz_reminders' => [
                'sometimes',
                'boolean',
            ],

            'assessment_results' => [
                'sometimes',
                'boolean',
            ],

            'certificate_issued' => [
                'sometimes',
                'boolean',
            ],

            'achievement_unlocked' => [
                'sometimes',
                'boolean',
            ],

            'course_completion' => [
                'sometimes',
                'boolean',
            ],

            'security_alerts' => [
                'sometimes',
                'boolean',
            ],

            'marketing' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}