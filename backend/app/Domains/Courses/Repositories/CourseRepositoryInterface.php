<?php

namespace App\Domains\Courses\Repositories;

use App\Models\Course;
use App\Domains\Courses\DTOs\UpdateCourseData;
use App\Domains\Courses\Queries\CourseQuery;
use App\Domains\Courses\Queries\InstructorCourseQuery;

interface CourseRepositoryInterface
{
    public function create(array $data): Course;

    public function find(string $id): ?Course;

    public function update(
        Course $course,
        array $data
    ): Course;

    public function publish(
        Course $course
    ): Course;

    public function delete(
        Course $course
    ): void;

    public function paginate(
        CourseQuery $query,
        int $perPage = 15
    );

    public function updateDetails(
        Course $course,
        UpdateCourseData $dto
    ): Course;

    public function submitForReview(
        Course $course
    ): Course;

    public function archive(
        Course $course
    ): Course;

    public function restore(
    Course $course
): Course;

    public function unpublish(
        Course $course
    ): Course;
    public function paginateInstructorCourses(
InstructorCourseQuery $query,
int $perPage = 15
);

public function instructorStatistics(
int $instructorId
): array;


}
