<?php

namespace App\Domains\Bootcamps\Requests;

use App\Enums\Bootcamps\BootcampDurationUnit;
use App\Enums\Courses\Difficulty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class CreateBootcampRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('bootcamps', 'slug'),
            ],
            'short_description' => ['nullable', 'string', 'max:500'],
            'description' => ['required', 'string', 'max:20000'],
            'duration_value' => ['required', 'integer', 'min:1', 'max:1000'],
            'duration_unit' => ['required', Rule::enum(BootcampDurationUnit::class)],
            'location' => ['required', 'string', 'max:255'],
            'price' => ['required', 'numeric', 'min:0', 'max:9999999'],
            'currency' => ['nullable', 'string', 'size:3'],
            'level' => ['required', Rule::enum(Difficulty::class)],
            'includes' => ['nullable', 'array'],
            'includes.challenges' => ['sometimes', 'boolean'],
            'includes.resources' => ['sometimes', 'boolean'],
            'includes.quizzes' => ['sometimes', 'boolean'],
            'includes.support' => ['sometimes', 'boolean'],
            'includes.certificate' => ['sometimes', 'boolean'],
            'includes.final_project' => ['sometimes', 'boolean'],
            'includes.classrooms' => ['sometimes', 'boolean'],
        ];
    }
}
