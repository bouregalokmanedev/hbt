<?php

namespace App\Domains\Courses\Repositories;

use App\Domains\Courses\Queries\CourseQuery;
use App\Enums\Courses\CourseStatus;
use App\Models\Course;
use App\Domains\Courses\Repositories\CourseRepositoryInterface;
use App\Domains\Courses\DTOs\UpdateCourseData;


class CourseRepository implements CourseRepositoryInterface
{
    public function create(array $data): Course
    {
        return Course::create($data);
    }

    public function find(string $id): ?Course
    {
        return Course::find($id);
    }

    public function update(
        Course $course,
        array $data
    ): Course {
        $course->update($data);

        return $course->refresh();
    }

    public function publish(
        Course $course
    ): Course {
        $course->update([
            'status' => CourseStatus::PUBLISHED,
            'published_at' => now(),
        ]);

        return $course->refresh();
    }

    public function delete(
        Course $course
    ): void {
        $course->delete();
    }

    public function paginate(
        CourseQuery $query,
        int $perPage = 15
    ) {
        $builder = Course::query();

        foreach ($query->filters() as $key => $value) {
            match ($key) {
                'status' => $builder->where('status', $value),

                'instructor' => $builder->where(
                    'instructor_id',
                    $value
                ),

                'difficulty' => $builder->where(
                    'difficulty',
                    $value
                ),

                'free' => $builder->where(
                    'is_free',
                    true
                ),

                'visibility' => $builder->where(
                    'visibility',
                    $value
                ),

                'search' => $builder->where(function ($q) use ($value) {
                    $q->where(
                        'title',
                        'like',
                        "%{$value}%"
                    )->orWhere(
                        'description',
                        'like',
                        "%{$value}%"
                    );
                }),

                default => null,
            };
        }

        return $builder->paginate($perPage);
    }

    // Keep your existing implementations for:
   public function updateDetails(
    Course $course,
    UpdateCourseData $dto
): Course {
    $course->update([
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
        'visibility' => $dto->visibility,
        'thumbnail' => $dto->thumbnail,
        'cover_image' => $dto->coverImage,
        'preview_video' => $dto->previewVideo,
        'meta_title' => $dto->metaTitle,
        'meta_description' => $dto->metaDescription,
        'metadata' => $dto->metadata,
    ]);

    return $course->refresh();
}
    public function submitForReview(
    Course $course
): Course {
    $course->update([
        'status' => CourseStatus::REVIEW,
    ]);

    return $course->refresh();
}
    public function archive(
    Course $course
): Course {
    $course->update([
        'status' => CourseStatus::ARCHIVED,
    ]);

    return $course->refresh();
}
   public function restore(
    Course $course
): Course {
    $course->update([
        'status' => CourseStatus::DRAFT,
    ]);

    return $course->refresh();
}
}