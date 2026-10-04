<?php

namespace App\Domains\Courses\Listeners;

use App\Domains\Courses\Events\SectionPublished;
use App\Domains\Notifications\Actions\NotifyEnrolledStudentsAction;

/**
 * New section in a course the student is enrolled on -> My Courses badge.
 */
final class SendSectionPublishedNotification
{
    public function handle(SectionPublished $event): void
    {
        $section = $event->section->loadMissing('course');

        $course = $section->course;

        if ($section->course_id === null || $course === null) {
            return;
        }

        app(NotifyEnrolledStudentsAction::class)->execute(
            (string) $section->course_id,
            'course_updates',
            'New section published',
            "A new section, \"{$section->title}\", was added to \"{$course->title}\". Open My Courses to continue.",
            '/my-courses',
            "section-published:{$section->id}",
        );
    }
}
