<?php

namespace App\Domains\StudentAssessments\Queries;

use App\Domains\Assessments\Models\Assessment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class AvailableAssessmentQuery
{
    public function paginate(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Assessment::query()
            ->with(['course:id,title', 'questions'])
            ->where('status', 'published')
            ->withCount('questions');

        if (! empty($filters['course_id'])) {
            $query->where('course_id', $filters['course_id']);
        }

        if (! empty($filters['search'])) {
            $query->where('title', 'like', '%'.$filters['search'].'%');
        }

        if (! empty($filters['status']) && $filters['status'] === 'available') {
            // Eligibility will be computed in resource layer
        }

        return $query->orderBy('published_at')->paginate($perPage);
    }
}
