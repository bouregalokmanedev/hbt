<?php

namespace App\Domains\Enrollments\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class CreateEnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'course_id' => [
                'required',
                'uuid',
                'exists:courses,id',
            ],
        ];
    }
}
