<?php

namespace App\Domains\DiagnosticScenarios\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StartDiagnosticAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'course_id' => ['nullable', 'uuid', 'exists:courses,id'],
        ];
    }
}
