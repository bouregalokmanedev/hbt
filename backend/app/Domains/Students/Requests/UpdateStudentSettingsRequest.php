<?php

namespace App\Domains\Students\Requests;

use App\Domains\Students\Enums\Appearance;
use App\Domains\Students\Enums\StudentLanguage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'language' => [
                'sometimes',
                'string',
                Rule::enum(StudentLanguage::class),
            ],

            'timezone' => [
                'sometimes',
                'string',
                'timezone',
            ],

            'appearance' => [
                'sometimes',
                'string',
                Rule::enum(Appearance::class),
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