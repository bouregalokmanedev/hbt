<?php

namespace App\Domains\Students\Controllers;

use App\Domains\Students\Requests\UpdateAppearanceSettingsRequest;
use App\Domains\Students\Services\StudentSettingsService;
use App\Http\Controllers\Controller;
use App\Domains\Students\Resources\StudentAppearanceSettingsResource;

class StudentAppearanceSettingsController extends Controller
{
    public function __construct(
        private readonly StudentSettingsService $settingsService,
    ) {
    }

    public function update(
        UpdateAppearanceSettingsRequest $request,
    ) {
        $settings = $this->settingsService->update(
            $request->user(),
            $request->validated(),
        );

        return (new StudentAppearanceSettingsResource(
            $settings->load([
                'user.studentNotificationSetting',
                'user.studentPrivacySetting',
                'user.studentLearningPreference',
            ]),
        ))->response()
            ->setStatusCode(200);
    }
}