<?php

namespace App\Domains\Bootcamps\Requests;

use App\Enums\Bootcamps\BootcampDurationUnit;
use App\Enums\Courses\Difficulty;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateBootcampRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                'alpha_dash',
                Rule::unique('bootcamps', 'slug')
                    ->ignore($this->route('bootcamp')),
            ],
            'short_description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'description' => ['sometimes', 'required', 'string', 'max:20000'],
            'duration_value' => ['sometimes', 'required', 'integer', 'min:1', 'max:1000'],
            'duration_unit' => [
                'sometimes',
                'required',
                Rule::enum(BootcampDurationUnit::class),
            ],
            'location' => ['sometimes', 'required', 'string', 'max:255'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0', 'max:9999999'],
            'currency' => ['sometimes', 'nullable', 'string', 'size:3'],
            'level' => ['sometimes', 'required', Rule::enum(Difficulty::class)],
            'includes' => ['sometimes', 'nullable', 'array'],
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
