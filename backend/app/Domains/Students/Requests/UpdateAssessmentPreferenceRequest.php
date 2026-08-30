<?php

namespace App\Domains\Students\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAssessmentPreferenceRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'show_timer' => ['sometimes', 'boolean'],
            'confirm_before_submit' => ['sometimes', 'boolean'],
            'show_result_breakdown' => ['sometimes', 'boolean'],
            'email_result_notifications' => ['sometimes', 'boolean'],
        ];
    }
}
