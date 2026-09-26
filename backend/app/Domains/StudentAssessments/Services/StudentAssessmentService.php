<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Services\AssessmentEligibilityService;
use App\Models\User;
use Illuminate\Support\Collection;

final class StudentAssessmentService
{
    public function __construct(private readonly AssessmentEligibilityService $eligibility) {}

    /**
     * List available assessments for student with eligibility evidence.
     */
    public function listAvailable(User $user): Collection
    {
        return Assessment::query()
            ->with(['course:id,title', 'section:id,title,course_id', 'lesson:id,title,section_id'])
            ->where('status', 'published')
            ->whereHas('course.enrollments', fn ($q) => $q->where('user_id', $user->id))
            ->withCount('questions')
            ->orderBy('published_at')
            ->get()
            ->map(fn (Assessment $a) => [
                'assessment' => $a,
                'eligibility' => $this->eligibility->evaluate($a, $user),
            ]);
    }

    public function getDetails(Assessment $assessment, User $user): array
    {
        $assessment->load(['course:id,title', 'section:id,title,course_id', 'lesson:id,title,section_id', 'questions']);
        return [
            'assessment' => $assessment,
            'eligibility' => $this->eligibility->evaluate($assessment, $user),
            'questions_count' => $assessment->questions->count(),
        ];
    }
}
