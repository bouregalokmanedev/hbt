<?php

namespace App\Domains\Courses\Repositories;

use App\Models\CourseProgress;
use Illuminate\Database\Eloquent\Collection;

interface CourseProgressRepositoryInterface
{
    public function find(string $id): ?CourseProgress;

    public function findOrFail(string $id): CourseProgress;

    public function findByUserAndCourse(
        int $userId,
        string $courseId
    ): ?CourseProgress;

    public function findByUser(int $userId): Collection;

    public function findByCourse(string $courseId): Collection;

    public function create(array $data): CourseProgress;

    public function update(
        CourseProgress $progress,
        array $data
    ): CourseProgress;
}
