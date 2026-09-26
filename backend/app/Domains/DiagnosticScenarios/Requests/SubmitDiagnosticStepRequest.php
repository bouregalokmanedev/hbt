<?php

namespace App\Domains\DiagnosticScenarios\Requests;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticTool;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

final class SubmitDiagnosticStepRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            // Legacy key from existing controller.
            'choice' => ['nullable', 'array'],
            // Canonical key going forward.
            'payload' => ['nullable', 'array'],
            'tool' => ['nullable', new Enum(DiagnosticTool::class)],
        ];
    }

    /**
     * Student action payload. Accepts `payload` (canonical) or `choice` (legacy).
     */
    public function actionPayload(): array
    {
        $payload = $this->input('payload', $this->input('choice', []));

        return is_array($payload) ? $payload : [];
    }

    public function actionTool(): ?DiagnosticTool
    {
        $tool = $this->input('tool');

        return $tool !== null ? DiagnosticTool::from($tool) : null;
    }
}
