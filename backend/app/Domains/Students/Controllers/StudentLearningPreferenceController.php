<?php

namespace App\Domains\Students\Controllers;

use App\Domains\Students\Requests\UpdateLearningPreferenceRequest;
use App\Domains\Students\Services\StudentLearningPreferenceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class StudentLearningPreferenceController extends Controller
{
    public function __construct(
        private readonly StudentLearningPreferenceService $service,
    ) {
    }

    public function update(
        UpdateLearningPreferenceRequest $request,
    ): JsonResponse {
        $settings = $this->service->update(
            $request->user(),
            $request->validated(),
        );

        return response()->json([
            'data' => $settings,
        ]);
    }
}