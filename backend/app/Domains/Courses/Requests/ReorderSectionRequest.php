<?php

namespace App\Domains\Courses\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReorderSectionRequest extends FormRequest
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