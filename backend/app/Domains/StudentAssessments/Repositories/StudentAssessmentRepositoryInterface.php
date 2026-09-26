<?php

namespace App\Domains\StudentAssessments\Repositories;

use App\Domains\Assessments\Models\Assessment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface StudentAssessmentRepositoryInterface
{
    public function availableFor(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator;
    public function find(string $id): Assessment;
}
