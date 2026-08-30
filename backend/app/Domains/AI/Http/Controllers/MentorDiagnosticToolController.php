<?php

namespace App\Domains\AI\Http\Controllers;

use App\Domains\AI\Services\MentorDiagnosticToolService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class MentorDiagnosticToolController
{
    public function __construct(private readonly MentorDiagnosticToolService $tools) {}

    public function voltageDrop(Request $request): JsonResponse
    {
        $data = $request->validate(['source_voltage' => ['required', 'numeric', 'min:0.01'], 'load_voltage' => ['required', 'numeric', 'min:0']]);
        return response()->json(['data' => $this->tools->voltageDrop((float) $data['source_voltage'], (float) $data['load_voltage'])]);
    }

    public function checklist(Request $request): JsonResponse
    {
        $data = $request->validate(['symptom' => ['required', 'string', 'max:500']]);
        return response()->json(['data' => $this->tools->diagnosticChecklist($data['symptom'])]);
    }
}
