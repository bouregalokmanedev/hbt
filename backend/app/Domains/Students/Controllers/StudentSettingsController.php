<?php

namespace App\Domains\Students\Controllers;

use App\Domains\Students\Requests\UpdateStudentSettingsRequest;
use App\Domains\Students\Resources\StudentSettingsResource;
use App\Domains\Students\Services\StudentSettingsService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentSettingsController extends Controller
{
    public function __construct(
        private readonly StudentSettingsService $settingsService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $settings = $this->settingsService->getFor(
            $request->user(),
        );

        return response()->json([
            'data' => new StudentSettingsResource(
                $settings,
            ),
        ]);
    }

    public function update(
        UpdateStudentSettingsRequest $request,
    ): JsonResponse {
        $this->settingsService->update(
            $request->user(),
            $request->validated(),
        );

        /*
         * Return the complete settings after the update.
         *
         * This keeps the frontend synchronized with the
         * actual backend state.
         */
        $settings = $this->settingsService->getFor(
            $request->user(),
        );

        return response()->json([
            'message' => 'Settings updated successfully.',
            'data' => new StudentSettingsResource(
                $settings,
            ),
        ]);
    }
}