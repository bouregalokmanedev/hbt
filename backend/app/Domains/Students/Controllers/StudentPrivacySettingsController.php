<?php

namespace App\Domains\Students\Controllers;

use App\Domains\Students\Requests\UpdatePrivacySettingsRequest;
use App\Domains\Students\Services\StudentPrivacySettingsService;
use App\Http\Controllers\Controller;

class StudentPrivacySettingsController extends Controller
{
    public function __construct(
        private readonly StudentPrivacySettingsService $service,
    ) {
    }

    public function update(
        UpdatePrivacySettingsRequest $request,
    ) {
        $settings = $this->service->update(
            $request->user(),
            $request->validated(),
        );

        return response()->json([
            'data' => $settings,
        ]);
    }
}