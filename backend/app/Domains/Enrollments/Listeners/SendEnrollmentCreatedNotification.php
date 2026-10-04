<?php

namespace App\Domains\Enrollments\Listeners;

use App\Domains\Enrollments\Events\EnrollmentCreated;
use App\Domains\Notifications\Services\StudentNotificationService;

/**
 * Lights the My Courses sidebar badge the moment a course unlocks, however the
 * enrollment arrived — self-enroll, admin enrollment, or a paid order all flow
 * through EnrollmentCreated.
 */
final class SendEnrollmentCreatedNotification
{
    public function handle(EnrollmentCreated $event): void
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
            'Course unlocked',
            "\"{$courseTitle}\" is now in My Courses. Everything you need is waiting inside — start whenever you are ready.",
            '/my-courses',
            "enrollment-notice:{$enrollment->id}",
        );
    }
}
