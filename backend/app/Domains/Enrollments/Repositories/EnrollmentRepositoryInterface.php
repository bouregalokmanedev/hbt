<?php

namespace App\Domains\Enrollments\Repositories;

use App\Models\Enrollment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface EnrollmentRepositoryInterface
{
    public function find(string $id): ?Enrollment;

    public function findOrFail(string $id): Enrollment;

    public function findByUserAndCourse(
        int $userId,
        string $courseId
    ): ?Enrollment;

    public function findByUser(
        int $userId
    ): Collection;

    public function paginateByUser(
        int $userId,
        int $perPage = 100,
    ): LengthAwarePaginator;

    public function findByCourse(
        string $courseId
    ): Collection;

    public function create(array $data): Enrollment;

    public function update(
        Enrollment $enrollment,
        array $data
    ): Enrollment;

    public function delete(
        Enrollment $enrollment
    ): void;
}