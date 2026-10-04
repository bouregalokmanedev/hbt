<?php

namespace App\Domains\Notifications\Actions;

use App\Domains\Notifications\Services\StudentNotificationService;
use App\Enums\EnrollmentStatus;
use App\Models\User;

/**
 * Fan one student-facing notification out to everyone actively enrolled on a
 * course — the "something new landed in your course" path used when a section,
 * lesson or assessment is published.
 *
 * Every recipient shares the same dedupe key, so StudentNotificationService
 * collapses repeats per student: republishing within the same event window
 * cannot mail the cohort twice.
 */
final class NotifyEnrolledStudentsAction
{
    /**
     * $courseId is the uuid primary key of the courses table — it must stay a
     * string, (int)-casting it collapses the lookup to 0 and fans out to nobody.
     */
    public function execute(
        string $courseId,
        string $type,
        string $title,
        string $message,
        string $actionUrl,
        string $dedupeKey,
    ): int {
        $sent = 0;

        User::query()
            ->whereHas('enrollments', fn ($query) => $query
                ->where('course_id', $courseId)
                ->where('status', EnrollmentStatus::ACTIVE->value))
            ->each(function (User $student) use ($type, $title, $message, $actionUrl, $dedupeKey, &$sent): void {
                if (app(StudentNotificationService::class)->send(
                    $student,
                    $type,
                    $title,
                    $message,
                    $actionUrl,
                    $dedupeKey,
                )) {
                    $sent++;
                }
            });

        return $sent;
    }
}
