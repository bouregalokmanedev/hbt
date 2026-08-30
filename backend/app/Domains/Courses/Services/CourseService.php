<?php

namespace App\Domains\Courses\Services;

use App\Domains\Courses\DTOs\CreateCourseData;
use App\Domains\Courses\DTOs\PublishCourseData;
use App\Domains\Courses\DTOs\UpdateCourseData;
use App\Domains\Courses\Events\CourseArchived;
use App\Domains\Courses\Events\CourseCreated;
use App\Domains\Courses\Events\CourseDeleted;
use App\Domains\Courses\Events\CoursePublished;
use App\Domains\Courses\Events\CourseRestored;
use App\Domains\Courses\Events\CourseSubmittedForReview;
use App\Domains\Courses\Events\CourseUpdated;
use App\Domains\Courses\Events\CourseUnpublished;
use App\Domains\Courses\Exceptions\CourseAlreadyPublishedException;
use App\Domains\Courses\Exceptions\CourseArchivedException;
use App\Domains\Courses\Repositories\CourseRepositoryInterface;
use App\Enums\Courses\CourseStatus;
use App\Models\Course;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

final class CourseService
{
    public function __construct(
        private readonly CourseRepositoryInterface $courses,
        private readonly CourseValidationService $validator,
    ) {}

    public function create(
        CreateCourseData $dto
    ): Course {
        return DB::transaction(function () use ($dto) {
            $course = $this->courses->create([
                'instructor_id' => $dto->instructorId,
                'title' => $dto->title,
                'slug' => $dto->slug,
                'short_description' => $dto->shortDescription,
                'description' => $dto->description,
                'language' => $dto->language,
                'difficulty' => $dto->difficulty,
                'duration_minutes' => $dto->durationMinutes,
                'price' => $dto->price,
                'discount_price' => $dto->discountPrice,
                'currency' => $dto->currency,
                'is_free' => $dto->isFree,
                'status' => CourseStatus::DRAFT,
                'visibility' => $dto->visibility,
                'thumbnail' => $dto->thumbnail,
                'cover_image' => $dto->coverImage,
                'preview_video' => $dto->previewVideo,
                'meta_title' => $dto->metaTitle,
                'meta_description' => $dto->metaDescription,
                'metadata' => $dto->metadata,
            ]);

            event(new CourseCreated($course));

            return $course;
        });
    }

    public function publish(
        PublishCourseData $dto
    ): Course {
        return DB::transaction(function () use ($dto) {
            $course = $this->courses->find($dto->courseId);

            if (! $course) {
                throw new ModelNotFoundException;
            }

            if ($course->status === CourseStatus::PUBLISHED) {
                throw new CourseAlreadyPublishedException;
            }

            if ($course->status === CourseStatus::ARCHIVED) {
                throw new CourseArchivedException;
            }

            $this->validator->validateForPublishing($course);

            $course = $this->courses->update(
                $course,
                [
                    'status' => CourseStatus::PUBLISHED,
                    'published_at' => now(),
                ]
            );

            event(new CoursePublished($course));

            return $course;
        });
    }

    public function update(
        UpdateCourseData $dto
    ): Course {
        return DB::transaction(function () use ($dto) {
            $course = $this->courses->find($dto->courseId);

            if (! $course) {
                throw new ModelNotFoundException;
            }

            if ($course->status === CourseStatus::ARCHIVED) {
                throw new CourseArchivedException;
            }

            $fields = [
                'title',
                'slug',
                'short_description',
                'description',
                'language',
                'difficulty',
                'duration_minutes',
                'price',
                'discount_price',
                'currency',
                'is_free',
                'visibility',
                'thumbnail',
                'cover_image',
                'preview_video',
                'meta_title',
                'meta_description',
                'metadata',
            ];

            $old = $course->only($fields);

            $course = $this->courses->updateDetails(
                $course,
                $dto
            );

            $new = $course->fresh()->only($fields);

            event(new CourseUpdated(
                course: $course,
                old: $old,
                new: $new,
            ));

            return $course;
        });
    }

    public function delete(
        Course $course
    ): void {
        DB::transaction(function () use ($course) {
            $this->courses->delete($course);

            event(new CourseDeleted($course));
        });
    }

    public function submitForReview(
        Course $course
    ): Course {
        return DB::transaction(function () use ($course) {
            $this->validator->ensureCanSubmitForReview($course);

            $course = $this->courses->submitForReview($course);

            event(new CourseSubmittedForReview($course));

            return $course;
        });
    }

    public function archive(
        Course $course
    ): Course {
        return DB::transaction(function () use ($course) {
            $this->validator->ensureCanArchive($course);

            $course = $this->courses->archive($course);

            event(new CourseArchived($course));

            return $course;
        });
    }

    public function restore(
        Course $course
    ): Course {
        return DB::transaction(function () use ($course) {
            $this->validator->ensureCanRestore($course);

            $course = $this->courses->restore($course);

            event(new CourseRestored($course));

            return $course;
        });
    }

    public function unpublish(Course $course): Course
    {
        return DB::transaction(function () use ($course) {
            if ($course->status !== CourseStatus::PUBLISHED) {
                throw new CourseReviewStateException(
                    'Only published courses can be unpublished.'
                );
            }

            $course = $this->courses->unpublish($course);

            event(new CourseUnpublished($course));

            return $course;
        });
    }
}
