<?php

namespace App\Domains\Lessons\Listeners;

use App\Domains\Lessons\Events\LessonCompleted;
use App\Domains\Notifications\Services\StudentNotificationService;

final class SendLessonCompletedNotification
{
    public function __construct(
        private readonly StudentNotificationService $notifications,
    ) {}

    public function handle(LessonCompleted $event): void
    {
        $progress = $event->progress->loadMissing('user', 'lesson.section.course');

        $user = $progress->user;
        $lesson = $progress->lesson;

        if ($user === null || $lesson === null) {
            return;
        }

        $course = $lesson->section?->course;
        $courseTitle = $course?->title;
        // Always the list page: /my-courses/:id has no frontend route (it
        // 404s), and useSidebarBadges only auto-clears on the exact
        // /my-courses path, so the deep link left a permanent badge behind.
        $actionUrl = '/my-courses';

        $message = $courseTitle !== null
            ? "You finished \"{$lesson->title}\" in {$courseTitle}. Solid work — keep the momentum going."
            : "You finished \"{$lesson->title}\". Solid work — keep the momentum going.";

        $this->notifications->send(
            $user,
            'lesson_completed',
            'Lesson completed',
            $message,
            $actionUrl,
            'lesson-completed:'.$progress->id,
        );
    }
}
