<?php

namespace App\Domains\Certificates\Listeners;

use App\Domains\Assessments\Events\AssessmentPassed;
use App\Domains\Certificates\Actions\IssueCertificateAction;
use App\Domains\Courses\Services\CoursePassService;
use App\Enums\EnrollmentStatus;

final class IssueCertificateForPassedAssessment
{
    public function __construct(
        private readonly CoursePassService $coursePass,
        private readonly IssueCertificateAction $issueCertificate,
    ) {
    }

    public function handle(AssessmentPassed $event): void
    {
        $result = $event->result->loadMissing(
            'assessment.course',
            'user',
        );

        if (! $result->passed) {
            return;
        }

        $assessment = $result->assessment;

        // Low-stakes assessments (diagnostic/formative/practice) never
        // earn certificates — only summative/final do.
        if (! $assessment->assessment_mode->isHighStakes()) {
            return;
        }

        // A section or lesson assessment can be summative, but it cannot
        // certify the whole course. Only a course-scoped final/summative
        // assessment may do that.
        if ($assessment->scope() !== 'course') {
            return;
        }

        $enrollment = $result->user
            ->enrollments()
            ->where('course_id', $assessment->course_id)
            ->whereIn('status', [
                EnrollmentStatus::ACTIVE->value,
                EnrollmentStatus::COMPLETED->value,
            ])
            ->latest('created_at')
            ->first();

        if (! $enrollment) {
            return;
        }

        // Passing the final assessment is necessary but not sufficient:
        // lessons, required quizzes and practicals must be complete too.
        if (! $this->coursePass->hasPassed($assessment->course, $result->user)) {
            return;
        }

        $this->issueCertificate->execute($result);
    }
}
