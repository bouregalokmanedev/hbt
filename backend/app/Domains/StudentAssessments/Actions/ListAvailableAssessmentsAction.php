<?php

namespace App\Domains\StudentAssessments\Actions;

use App\Domains\StudentAssessments\Services\StudentAssessmentService;
use App\Models\User;
use Illuminate\Support\Collection;

final class ListAvailableAssessmentsAction
{
    public function __construct(private readonly StudentAssessmentService $service) {}

    public function execute(User $user): Collection
    {
        return $this->service->listAvailable($user);
    }
}
