<?php

namespace App\Domains\Courses\Requests;

use App\Models\Section;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $section = $this->route('section');

        if (! $section instanceof Section) {
            return false;
        }

        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'slug' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->has('status')) {
                $validator->errors()->add(
                    'status',
                    'The status cannot be changed through the update endpoint.'
                );
            }

            if ($this->has('position')) {
                $validator->errors()->add(
                    'position',
                    'The position cannot be changed through the update endpoint.'
                );
            }
        });
    }
}