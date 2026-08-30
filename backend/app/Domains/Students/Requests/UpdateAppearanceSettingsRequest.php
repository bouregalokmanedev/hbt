<?php

namespace App\Domains\Students\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAppearanceSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'appearance' => [
                'sometimes',
                'string',
                Rule::in([
                    'system',
                    'light',
                    'dark',
                ]),
            ],

            'theme' => [
                'sometimes',
                'string',
                'max:50',
            ],

            'compact_mode' => [
                'sometimes',
                'boolean',
            ],

            'reduced_motion' => [
                'sometimes',
                'boolean',
            ],
        ];
    }
}