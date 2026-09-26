<?php

namespace App\Domains\Certificates\Actions;

use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Models\Certificate;
use App\Models\Enrollment;
use Illuminate\Support\Facades\DB;
use LogicException;

final class IssueCertificateAction
{
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

            $enrollment = Enrollment::query()
                ->where('user_id', $result->user_id)
                ->where('course_id', $result->assessment->course_id)
                ->first();

            if (!$enrollment) {
                throw new LogicException(
                    'The user does not have an enrollment for this course.'
                );
            }

            $certificate = Certificate::query()->firstOrCreate(
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

            if ($certificate->wasRecentlyCreated) {
                $courseTitle = (string) $result->assessment->course->title;
                app(StudentNotificationService::class)->send(
                    $result->user,
                    'certificate_issued',
                    'Certificate earned',
                    "Your certificate for \"{$courseTitle}\" is ready. Well done — this one is yours to keep.",
                    '/certificates',
                    'certificate-issued:'.$certificate->id,
                );
            }

            return $certificate;
        });
    }
}