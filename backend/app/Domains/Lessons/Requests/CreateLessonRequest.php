<?php

namespace App\Domains\Lessons\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'section_id' => [
                'required',
                'uuid',
                'exists:sections,id',
            ],

            'title' => [
                'nullable',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'content' => [
                'nullable',
                'string',
            ],

            'position' => [
                'required',
                'integer',
                'min:1',
            ],

            'status' => [
                'nullable',
                'string',
                'in:draft,published',
            ],
        ];
    }
}