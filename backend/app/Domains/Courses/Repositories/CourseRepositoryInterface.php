<?php

namespace App\Domains\Courses\Repositories;

use App\Models\Course;

interface CourseRepositoryInterface
{
    public function create(CreateCourseData $dto): Course;

    public function find(string $id): ?Course;

    public function paginate(int $perPage = 15);

    public function updateDetails(
        Course $course,
        UpdateCourseData $dto
    ): Course;

    public function submitForReview(Course $course): Course;

    public function publish(Course $course): Course;

    public function archive(Course $course): Course;

    public function restore(Course $course): Course;

    public function delete(Course $course): void;
}