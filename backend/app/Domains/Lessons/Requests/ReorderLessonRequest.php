<?php

namespace App\Domains\Lessons\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderLessonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'position' => [
                'required',
                'integer',
                'min:1',
            ],
        ];
    }
}