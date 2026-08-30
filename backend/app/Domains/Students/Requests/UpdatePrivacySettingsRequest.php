<?php

namespace App\Domains\Students\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePrivacySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'profile_visibility' => [
                'sometimes',
                Rule::in([
                    'private',
                    'connections',
                    'public',
                ]),
            ],

            'show_learning_activity' => [
                'sometimes',
                'boolean',
            ],

            'show_achievements' => [
                'sometimes',
                'boolean',
            ],

            'show_certificates' => [
                'sometimes',
                'boolean',
            ],

            'show_course_progress' => [
                'sometimes',
                'boolean',
            ],

            'allow_personalized_recommendations' => [
                'sometimes',
                'boolean',
            ],

            'allow_analytics' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}