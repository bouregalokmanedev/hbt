<?php

namespace App\Domains\Courses\Services;

use App\Domains\Courses\Exceptions\CourseAlreadyArchivedException;
use App\Domains\Courses\Exceptions\CourseCannotBePublishedException;
use App\Domains\Courses\Exceptions\CourseReviewStateException;
use App\Domains\Courses\Specifications\CourseCanBeArchivedSpecification;
use App\Domains\Courses\Specifications\CourseCanBePublishedSpecification;
use App\Domains\Courses\Specifications\CourseCanBeRestoredSpecification;
use App\Domains\Courses\Specifications\CourseCanBeSubmittedForReviewSpecification;
use App\Domains\Courses\Specifications\CourseHasDescriptionSpecification;
use App\Domains\Courses\Specifications\CourseHasDurationSpecification;
use App\Domains\Courses\Specifications\CourseHasPublishedLessonsSpecification;
use App\Domains\Courses\Specifications\CourseHasSectionsSpecification;
use App\Domains\Courses\Specifications\CourseHasThumbnailSpecification;
use App\Domains\Courses\Specifications\CourseHasTitleSpecification;
use App\Enums\Courses\CourseStatus;
use App\Models\Course;

final class CourseValidationService
{
    public function __construct(
        private readonly CourseCanBePublishedSpecification $canBePublished,
        private readonly CourseCanBeSubmittedForReviewSpecification $canBeSubmittedForReview,
        private readonly CourseCanBeArchivedSpecification $canBeArchived,
        private readonly CourseCanBeRestoredSpecification $canBeRestored,
        private readonly CourseHasDescriptionSpecification $hasDescription,
        private readonly CourseHasDurationSpecification $hasDuration,
        private readonly CourseHasThumbnailSpecification $hasThumbnail,
        private readonly CourseHasSectionsSpecification $hasSections,
        private readonly CourseHasPublishedLessonsSpecification $hasPublishedLessons,
        private readonly CourseHasTitleSpecification $hasTitle,
    ) {
    }

    public function validateForPublishing(
        Course $course
    ): void {
        if (! $this->canBePublished->isSatisfiedBy($course)) {
            if ($course->status === CourseStatus::ARCHIVED) { 
                throw new CourseCannotBePublishedException(
                    'An archived course cannot be published.'
                );
            }

            throw new CourseCannotBePublishedException(
                'The course is already published or cannot be published from its current state.'
            );
        }
        if (! $this->hasTitle->isSatisfiedBy($course)) {
    throw CourseCannotBePublishedException::because(
        'Course title is required.'
    );
}

        if (! $this->hasDescription->isSatisfiedBy($course)) {
            throw CourseCannotBePublishedException::because(
                'Course description is required.'
            );
        }

        if (! $this->hasDuration->isSatisfiedBy($course)) {
            throw CourseCannotBePublishedException::because(
                'Course duration is required.'
            );
        }

        if (! $this->hasThumbnail->isSatisfiedBy($course)) {
            throw CourseCannotBePublishedException::because(
                'Thumbnail is required.'
            );
        }

        if (! $this->hasSections->isSatisfiedBy($course)) {
            throw CourseCannotBePublishedException::because(
                'Course must contain at least one section.'
            );
        }

        if (! $this->hasPublishedLessons->isSatisfiedBy($course)) {
            throw CourseCannotBePublishedException::because(
                'Course must contain at least one published lesson.'
            );
        }
    }

    public function ensureCanSubmitForReview(
        Course $course
    ): void {
        if (
            ! $this->canBeSubmittedForReview->isSatisfiedBy($course)
        ) {
            throw new CourseReviewStateException(
                'Only draft courses can be submitted for review.'
            );
        }
    }

    public function ensureCanArchive(
        Course $course
    ): void {
        if (
            ! $this->canBeArchived->isSatisfiedBy($course)
        ) {
            throw new CourseAlreadyArchivedException(
                'The course is already archived.'
            );
        }
    }

    public function ensureCanRestore(
        Course $course
    ): void {
        if (
            ! $this->canBeRestored->isSatisfiedBy($course)
        ) {
            throw new CourseReviewStateException(
                'Only archived courses can be restored.'
            );
        }
    }
}
