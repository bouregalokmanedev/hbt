<?php

namespace App\Domains\Enrollments\Listeners;

use App\Domains\Enrollments\Events\EnrollmentCancelled;
use App\Domains\Notifications\Services\StudentNotificationService;

/**
 * The student should learn from the badge, not by finding the course missing
 * from My Courses on their next visit.
 */
final class SendEnrollmentCancelledNotification
{
    public function handle(EnrollmentCancelled $event): void
    {
        $enrollment = $event->enrollment->loadMissing('user', 'course');

        $user = $enrollment->user;

        if ($user === null) {
            return;
        }

        $courseTitle = (string) ($enrollment->course?->title ?? 'your course');

        app(StudentNotificationService::class)->send(
            $user,
            'enrollment',
            'Enrollment cancelled',
            "Your enrollment in \"{$courseTitle}\" was cancelled. Your progress is kept, and you can re-enroll whenever you want.",
            '/my-courses',
            "enrollment-cancelled-notice:{$enrollment->id}",
        );
    }
}
