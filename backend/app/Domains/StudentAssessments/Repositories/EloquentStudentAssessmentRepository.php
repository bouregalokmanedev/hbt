<?php

namespace App\Domains\StudentAssessments\Repositories;

use App\Domains\Assessments\Models\Assessment;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Domains\Assessments\Services\AssessmentEligibilityService;

final class EloquentStudentAssessmentRepository implements StudentAssessmentRepositoryInterface
{
    public function __construct(private readonly AssessmentEligibilityService $eligibility) {}

    public function availableFor(User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Assessment::query()
            ->with(['course:id,title', 'questions'])
            ->where('status', 'published')
            ->whereHas('course.enrollments', fn ($q) => $q->where('user_id', $user->id))
            ->withCount('questions');

        if (! empty($filters['course_id'])) {
            $query->where('course_id', $filters['course_id']);
        }

        if (! empty($filters['search'])) {
            $query->where('title', 'like', '%'.$filters['search'].'%');
        }

        return $query->orderBy('published_at')->paginate($perPage);
    }

    public function find(string $id): Assessment
    {
        return Assessment::with(['course:id,title', 'questions.options', 'competencies'])->findOrFail($id);
    }
}