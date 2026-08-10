<?php

namespace App\Domains\Lessons\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

public function rules(): array
{
    return [
        'title' => [
            'sometimes',
            'nullable',
            'string',
            'max:255',
        ],

        'slug' => [
            'sometimes',
            'nullable',
            'string',
            'max:255',
        ],

        'description' => [
            'sometimes',
            'nullable',
            'string',
        ],

        'content' => [
            'sometimes',
            'nullable',
            'string',
        ],
    ];
}

    }