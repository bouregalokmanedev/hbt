<?php

namespace App\Domains\Enrollments\Repositories;

use App\Models\Enrollment;
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