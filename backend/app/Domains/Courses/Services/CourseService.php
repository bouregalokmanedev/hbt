<?php

namespace App\Domains\Courses\Services;

use App\Domains\Courses\DTOs\CreateCourseData;
use App\Domains\Courses\Repositories\CourseRepositoryInterface;
use App\Domains\Courses\Events\CourseCreated;
use App\Models\Course;
use Illuminate\Support\Facades\DB;

class CourseService
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

        $course = $this->courses
            ->find($dto->courseId);

        if (! $course) {
            throw new ModelNotFoundException();
        }

        if ($course->status === CourseStatus::PUBLISHED) {

            throw new CourseAlreadyPublishedException();

        }

        if ($course->status === CourseStatus::ARCHIVED) {

            throw new CourseArchivedException();

        }

        $this->validator
            ->validateForPublishing($course);

        $course = $this->courses->update($course, [

            'status' => CourseStatus::PUBLISHED,

            'published_at' => now(),

        ]);

        event(
            new CoursePublished($course)
        );

        return $course;

    });

}
public function update(

    UpdateCourseData $dto

): Course {

    return DB::transaction(function () use ($dto){

        $course = $this->courses

            ->find($dto->courseId);

        if(

            $course->status

            === CourseStatus::ARCHIVED

        ){

            throw new CourseArchivedException();

        }

        $course = $this->courses

            ->updateDetails(

                $course,

                $dto

            );

        event(

            new CourseUpdated(

                $course

            )

        );

        return $course;

    });

}
}