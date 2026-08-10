<?php

namespace App\Domains\Lessons\Services;

use App\Enums\LessonStatus;
use App\Models\Lesson;
use DomainException;

final class LessonService
{
    public function validatePosition(int $position): void
    {
        if ($position < 1) {
            throw new DomainException(
                'Lesson position must be at least 1.'
            );
        }
    }

    public function validatePublishable(
        Lesson $lesson
    ): void {
        if (blank($lesson->title)) {
            throw new DomainException(
                'A lesson must have a title before publishing.'
            );
        }

        if (blank($lesson->slug)) {
            throw new DomainException(
                'A lesson must have a slug before publishing.'
            );
        }

        if (blank($lesson->content)) {
            throw new DomainException(
                'A lesson must have content before publishing.'
            );
        }

        $this->validatePosition(
            $lesson->position
        );
    }

   public function publish(
    Lesson $lesson
): Lesson {
    if ($lesson->status === LessonStatus::PUBLISHED) {
        throw new DomainException(
            'Lesson is already published.'
        );
    }

    $this->validatePublishable($lesson);

    $lesson->status = LessonStatus::PUBLISHED;

    return $lesson;
}

public function unpublish(
    Lesson $lesson
): Lesson {
    if ($lesson->status === LessonStatus::DRAFT) {
        throw new DomainException(
            'Lesson is already a draft.'
        );
    }

    $lesson->status = LessonStatus::DRAFT;

    return $lesson;
}

    public function validateReorderPosition(
    int $position
): void {
    $this->validatePosition($position);
}
}