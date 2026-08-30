<?php

namespace App\Domains\Students\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLearningPreferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'preferred_content_language' => [
                'sometimes',
                'string',
                Rule::in([
                    'en',
                    'fr',
                    'ar',
                ]),
            ],

            'difficulty_preference' => [
                'sometimes',
                'string',
                Rule::in([
                    'beginner',
                    'intermediate',
                    'advanced',
                    'adaptive',
                ]),
            ],

            'autoplay_lessons' => [
                'sometimes',
                'boolean',
            ],

            'resume_last_position' => [
                'sometimes',
                'boolean',
            ],

            'show_completed_lessons' => [
                'sometimes',
                'boolean',
            ],

            'show_quiz_explanations' => [
                'sometimes',
                'boolean',
            ],

            'confirm_before_quiz_submit' => [
                'sometimes',
                'boolean',
            ],

            'daily_learning_goal_minutes' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'weekly_learning_goal_minutes' => [
                'sometimes',
                'integer',
                'min:1',
            ],
        ];
    }
}