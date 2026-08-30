<?php

namespace App\Domains\Instructor\Queries;

use App\Models\Course;
use App\Models\CourseFeedback;

final class InstructorCourseFeedbackQuery
{
    public static function for(int $instructorId, string $courseId): array
    {
        $course = Course::query()
            ->whereKey($courseId)
            ->where('instructor_id', $instructorId)
            ->firstOrFail();

        $feedback = CourseFeedback::query()
            ->where('course_id', $course->id)
            ->with([
                'user:id,first_name,last_name',
                'lesson:id,title',
            ])
            ->latest()
            ->get();

        return [
            'summary' => [
                'total' => $feedback->count(),
                'average_rating' => round((float) ($feedback->avg('rating') ?? 0), 1),
                'rating_distribution' => collect(range(1, 5))
                    ->mapWithKeys(fn (int $rating) => [$rating => $feedback->where('rating', $rating)->count()])
                    ->all(),
            ],
            'recent_feedback' => $feedback->take(20)->map(fn (CourseFeedback $item) => [
                'id' => $item->id,
                'student_name' => $item->user?->full_name ?? 'Learner',
                'rating' => $item->rating,
                'comment' => $item->comment,
                'lesson_title' => $item->lesson?->title,
                'submitted_at' => $item->created_at?->toISOString(),
            ])->values()->all(),
        ];
    }
}
