<?php

namespace App\Domains\Certificates\Actions;

use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\Courses\Services\CoursePassService;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Enums\EnrollmentStatus;
use App\Models\Certificate;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;
use LogicException;

final class IssueCertificateAction
{
    public function __construct(
        private readonly CoursePassService $coursePass,
    ) {
    }

    public function execute(
        AssessmentResult $result
    ): Certificate {
        return DB::transaction(function () use ($result): Certificate {
            $result->loadMissing(
                'assessment.course',
                'user',
            );

            if (!$result->passed) {
                throw new LogicException(
                    'A certificate can only be issued for a passed assessment.'
                );
            }

            $assessment = $result->assessment;

            if (! $assessment->assessment_mode->isHighStakes() || $assessment->scope() !== 'course') {
                throw new LogicException(
                    'A certificate can only be issued for a course-scoped summative or final assessment.'
                );
            }

            $enrollment = Enrollment::query()
                ->where('user_id', $result->user_id)
                ->where('course_id', $assessment->course_id)
                ->whereIn('status', [
                    EnrollmentStatus::ACTIVE->value,
                    EnrollmentStatus::COMPLETED->value,
                ])
                ->latest('created_at')
                ->first();

            if (!$enrollment) {
                throw new LogicException(
                    'The user does not have an active enrollment for this course.'
                );
            }

            if (! $this->coursePass->hasPassed($assessment->course, $result->user)) {
                throw new LogicException(
                    'The course requirements have not been completed yet.'
                );
            }

            // One certificate per learner per course: a second passing attempt
            // must not mint a duplicate certificate.
            $certificate = Certificate::query()->firstOrCreate(
                [
                    'user_id' => $result->user_id,
                    'course_id' => $assessment->course_id,
                ],
                [
                    'enrollment_id' => $enrollment->id,
                    'assessment_result_id' => $result->id,
                    'recipient_name' => $result->user->full_name,
                    'course_title' => $assessment->course->title,
                    'issued_at' => $result->completed_at ?? now(),
                ],
            );

            // `send()` dedupes on `certificate-issued:{id}`, so calling it
            // unconditionally can never double-notify.
            $courseTitle = (string) $assessment->course->title;
            app(StudentNotificationService::class)->send(
                $result->user,
                'certificate_issued',
                'Certificate earned',
                "Your certificate for \"{$courseTitle}\" is ready. Well done — this one is yours to keep.",
                '/certificates',
                'certificate-issued:'.$certificate->id,
            );

            return $certificate;
        });
    }
}
