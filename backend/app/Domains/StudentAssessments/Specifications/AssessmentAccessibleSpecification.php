<?php

namespace App\Domains\StudentAssessments\Specifications;

use App\Domains\Assessments\Models\Assessment;
use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Strict access gate for starting an assessment (§15-16).
 *
 * Checks, in order:
 * - assessment published
 * - course published
 * - active enrollment for the course
 *
 * Does NOT duplicate eligibility logic — lessons, quizzes and scenarios
 * stay in AssessmentEligibilityService.
 */
final class AssessmentAccessibleSpecification
{
    public function __construct(
        private readonly AssessmentAvailableSpecification $availableSpec,
    ) {}

    public function isSatisfiedBy(Assessment $assessment, User $user): bool
    {
        return $this->reason($assessment, $user) === null;
    }

    public function reason(Assessment $assessment, User $user): ?string
    {
        if (! $this->availableSpec->isSatisfiedBy($assessment)) {
            return $this->availableSpec->reason($assessment);
        }

        // Read status via a fresh query: callers often eager-load a
        // partial `course:id,title` (e.g. details/list views), and
        // loadMissing would then see a status-less relation.
        $course = $assessment->course()->select('id', 'status')->first();

        if ($course === null || $course->status !== CourseStatus::PUBLISHED) {
            return 'The course for this assessment is not available.';
        }

        $hasActiveEnrollment = DB::table('enrollments')
            ->where('user_id', $user->id)
            ->where('course_id', $assessment->course_id)
            ->where('status', EnrollmentStatus::ACTIVE->value)
            ->exists();

        if (! $hasActiveEnrollment) {
            return 'An active enrollment is required to take this assessment.';
        }

        return null;
    }
}
