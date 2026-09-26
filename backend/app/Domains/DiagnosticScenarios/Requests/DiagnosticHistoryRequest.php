<?php

namespace App\Domains\DiagnosticScenarios\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class DiagnosticHistoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'scenario_id' => ['nullable', 'uuid', 'exists:diagnostic_scenarios,id'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
