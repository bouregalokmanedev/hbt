<?php

namespace App\Domains\Bootcamps\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SyncBootcampCurriculumRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'sections' => ['present', 'array', 'max:50'],
            'sections.*.id' => ['nullable', 'uuid'],
            'sections.*.title' => ['required', 'string', 'max:255'],
            'sections.*.lessons' => ['present', 'array', 'max:100'],
            'sections.*.lessons.*.id' => ['nullable', 'uuid'],
            'sections.*.lessons.*.title' => ['required', 'string', 'max:255'],
            'sections.*.lessons.*.classroom_count' => [
                'required',
                'integer',
                'min:0',
                'max:1000',
            ],
            'sections.*.lessons.*.duration_minutes' => [
                'required',
                'integer',
                'min:0',
                'max:100000',
            ],
        ];
    }
}
