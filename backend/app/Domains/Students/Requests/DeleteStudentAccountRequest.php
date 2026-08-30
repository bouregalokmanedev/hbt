<?php

namespace App\Domains\Students\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeleteStudentAccountRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', Rule::in(['not_using', 'content', 'technical', 'privacy', 'cost', 'other'])],
            'other_reason' => ['nullable', 'string', 'max:1000', 'required_if:reason,other'],
            'current_password' => ['required', 'current_password'],
            'confirm_deletion' => ['accepted'],
        ];
    }
}
