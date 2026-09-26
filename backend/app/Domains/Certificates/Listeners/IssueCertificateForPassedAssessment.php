<?php

namespace App\Domains\Certificates\Listeners;

use App\Domains\Assessments\Events\AssessmentPassed;
use App\Models\Certificate;

final class IssueCertificateForPassedAssessment
{
    public function handle(AssessmentPassed $event): void
    {
        $result = $event->result->loadMissing(
            'assessment.course',
            'user',
        );

        if (! $result->passed) {
            return;
        }

        // Low-stakes assessments (diagnostic/formative/practice) never
        // earn certificates — only summative/final do.
        if (! $result->assessment->assessment_mode->isHighStakes()) {
            return;
        }

        $enrollment = $result->user
            ->enrollments()
            ->where('course_id', $result->assessment->course_id)
            ->latest('created_at')
            ->first();

        if (! $enrollment) {
            return;
        }

        Certificate::query()->firstOrCreate(
            [
                'assessment_result_id' => $result->id,
            ],
            [
                'enrollment_id' => $enrollment->id,
                'course_id' => $result->assessment->course_id,
                'user_id' => $result->user_id,
                'recipient_name' => $result->user->full_name,
                'course_title' => $result->assessment->course->title,
                'issued_at' => $result->completed_at ?? now(),
            ],
        );
    }
}