<?php

namespace App\Domains\Lessons\Listeners;

use App\Domains\Lessons\Events\LessonPublished;
use App\Domains\Notifications\Actions\NotifyEnrolledStudentsAction;

/**
 * New lesson in a course the student is enrolled on -> My Courses badge.
 */
final class SendLessonPublishedNotification
{
    public function handle(LessonPublished $event): void
    {
        $lesson = $event->lesson->loadMissing('section.course');

        $course = $lesson->section?->course;
        $courseId = $lesson->section?->course_id;

        if ($courseId === null || $course === null) {
            return;
        }

        $courseTitle = (string) $course->title;

        app(NotifyEnrolledStudentsAction::class)->execute(
            (string) $courseId,
            'course_updates',
            'New lesson published',
            "\"{$lesson->title}\" was just added to \"{$courseTitle}\". Open My Courses to pick it up.",
            '/my-courses',
            "lesson-published:{$lesson->id}",
        );
    }
}
