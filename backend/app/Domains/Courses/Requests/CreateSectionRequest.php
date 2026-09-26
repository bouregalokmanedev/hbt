<?php

namespace App\Domains\Courses\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateSectionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $courseId = $this->input('course_id');
        $course = filled($courseId)
            ? \App\Models\Course::query()->find($courseId)
            : null;

        return $course !== null && $this->user()?->can('update', $course) === true;
    }

    public function rules(): array
    {
        return [
            'course_id' => [
                'required',
                'uuid',
                'exists:courses,id',
            ],

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'position' => [
                'required',
                'integer',
                'min:1',
            ],
        ];
    }
}