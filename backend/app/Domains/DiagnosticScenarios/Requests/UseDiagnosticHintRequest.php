<?php

namespace App\Domains\DiagnosticScenarios\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UseDiagnosticHintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'hint_id' => ['required', 'uuid', 'exists:diagnostic_scenario_hints,id'],
        ];
    }
}
