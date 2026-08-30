<?php

namespace App\Domains\Admin\Services;

use App\Domains\Courses\Actions\ArchiveCourseAction;
use App\Domains\Courses\Actions\PublishCourseAction;
use App\Domains\Courses\Actions\RestoreCourseAction;
use App\Domains\Courses\DTOs\PublishCourseData;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Enums\Courses\CourseStatus;
use App\Events\ModelChanged;
use App\Models\Course;

final readonly class CourseModerationService
{
    public function __construct(
        private PublishCourseAction $publish,
        private ArchiveCourseAction $archive,
        private RestoreCourseAction $restore,
        private StudentNotificationService $notifications,
    ) {
    }

    public function approve(Course $course, int $administratorId): Course
    {
        abort_unless($course->status === CourseStatus::REVIEW, 422, 'Only courses awaiting review can be approved.');

        $published = $this->publish->execute(new PublishCourseData(
            courseId: $course->id,
            publisherId: $administratorId,
        ));

        $this->notifyInstructor($published, 'approved', 'Your course was approved', "{$published->title} has been approved and published.");

        return $published;
    }

    public function publish(Course $course, int $administratorId): Course
    {
        return $this->publish->execute(new PublishCourseData(
            courseId: $course->id,
            publisherId: $administratorId,
        ));
    }

    public function reject(Course $course, string $reason): Course
    {
        abort_unless($course->status === CourseStatus::REVIEW, 422, 'Only courses awaiting review can be rejected.');

        $old = ['status' => $course->status->value];
        $course->update([
            'status' => CourseStatus::DRAFT,
            'published_at' => null,
        ]);

        event(new ModelChanged(
            event: 'course.rejected',
            model: $course,
            old: $old,
            new: ['status' => CourseStatus::DRAFT->value],
            metadata: ['reason' => $reason],
        ));

        $rejected = $course->fresh();

        $this->notifyInstructor($rejected, 'rejected', 'Your course needs updates', "{$rejected->title} was returned to draft. Feedback: {$reason}");

        return $rejected;
    }

    public function archive(Course $course): Course
    {
        return $this->archive->execute($course);
    }

    public function restore(Course $course): Course
    {
        return $this->restore->execute($course);
    }

    private function notifyInstructor(Course $course, string $outcome, string $title, string $message): void
    {
        $instructor = $course->instructor;

        if (! $instructor) {
            return;
        }

        $this->notifications->send(
            $instructor,
            'course_moderation',
            $title,
            $message,
            "/instructor/courses/{$course->id}",
            "course-moderation:{$course->id}:{$outcome}:{$course->updated_at?->timestamp}",
        );
    }
}
