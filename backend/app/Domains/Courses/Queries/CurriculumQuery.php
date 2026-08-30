<?php

namespace App\Domains\Courses\Queries;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\User;

use App\Models\Course;
use App\Domains\Quizzes\Enums\QuizStatus;

final class CurriculumQuery
{
    public function getForCourse(
        Course $course,
        ?User $user = null,
    ): Course {
        $course->load([
            'sections' => function ($query) {
                $query
                    ->where('status', SectionStatus::PUBLISHED)
                    ->orderBy('position');
            },

            'sections.lessons' => function ($query) {
                $query
                    ->where('status', LessonStatus::PUBLISHED)
                    ->orderBy('position');
            },
            'sections.quizzes' => fn ($query) => $query->where('status', QuizStatus::PUBLISHED)->orderBy('position'),
        ]);

        if ($user) {
            $course->load([
                'sections.lessons.progressForUser',
                'sections.quizzes.attempts' => fn ($query) => $query->where('user_id', $user->id)->latest('submitted_at'),
            ]);
        }

        return $course;
    }
}
