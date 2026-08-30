<?php

namespace App\Domains\Students\Controllers;

use App\Domains\Students\Requests\UpdateNotificationSettingsRequest;
use App\Domains\Students\Services\StudentNotificationSettingsService;
use App\Http\Controllers\Controller;

class StudentNotificationSettingsController extends Controller
{
    public function __construct(
        private readonly StudentNotificationSettingsService $service,
    ) {
    }

    public function update(
        UpdateNotificationSettingsRequest $request,
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