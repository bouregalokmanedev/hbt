<?php

namespace App\Domains\StudentAssessments\Actions;

use App\Domains\StudentAssessments\DTOs\SaveResponseData;
use App\Domains\StudentAssessments\Models\StudentAssessmentResponse;
use App\Domains\StudentAssessments\Services\ResponseService;
use App\Models\User;

final class SaveResponseAction
{
    public function __construct(private readonly ResponseService $responseService) {}

    public function execute(SaveResponseData $data, User $user): StudentAssessmentResponse
    {
        return $this->responseService->save($data, $user);
    }
}
