<?php

namespace App\Domains\Enrollments\Repositories;

use App\Enums\EnrollmentStatus;
use App\Models\Enrollment;
use Illuminate\Database\Eloquent\Collection;

final class EnrollmentRepository implements EnrollmentRepositoryInterface
{
    public function find(string $id): ?Enrollment
    {
        return Enrollment::query()->find($id);
    }

    public function findOrFail(string $id): Enrollment
    {
        return Enrollment::query()->findOrFail($id);
    }

    public function findByUserAndCourse(
        int $userId,
        string $courseId
    ): ?Enrollment {
        return Enrollment::query()
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();
    }

    public function findActiveByUserAndCourse(
        int $userId,
        string $courseId
    ): ?Enrollment {
        return Enrollment::query()
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->where('status', EnrollmentStatus::ACTIVE)
            ->first();
    }

    public function findByUser(
        int $userId
    ): Collection {
        return Enrollment::query()
            ->where('user_id', $userId)
            ->latest('enrolled_at')
            ->get();
    }

    public function create(
        array $data
    ): Enrollment {
        return Enrollment::query()->create($data);
    }

    public function update(
        Enrollment $enrollment,
        array $data
    ): Enrollment {
        $enrollment->update($data);

        return $enrollment->refresh();
    }
}
