<?php

namespace App\Domains\Quizzes\Services;

use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Enums\Courses\CourseStatus;
use App\Enums\SectionStatus;
use App\Models\User;

/**
 * Server-side access gate for section quizzes.
 *
 * The quiz player used to be the only thing stopping a learner from opening
 * a checkpoint quiz for a course they never enrolled in. Starting an attempt
 * is now gated here as well, so XP and scores cannot be farmed.
 */
final class QuizAccessService
{
    public function reason(Quiz $quiz, ?User $user): ?string
    {
        $quiz->loadMissing('section.course');

        if ($quiz->status !== QuizStatus::PUBLISHED) {
            return 'This quiz is not available.';
        }

        $section = $quiz->section;

        if ($section === null || $section->status !== SectionStatus::PUBLISHED) {
            return 'The section for this quiz is not available.';
        }

        $course = $section->course;

        if ($course === null || $course->status !== CourseStatus::PUBLISHED) {
            return 'The course for this quiz is not available.';
        }

        if ($user === null || ! $course->enrollments()
            ->where('user_id', $user->id)
            ->whereIn('status', ['active', 'completed'])
            ->exists()) {
            return 'An active enrollment is required to take this quiz.';
        }

        return null;
    }

    public function canAccess(Quiz $quiz, ?User $user): bool
    {
        return $this->reason($quiz, $user) === null;
    }
}
