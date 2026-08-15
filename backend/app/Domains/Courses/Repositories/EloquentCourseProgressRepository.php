<?php

namespace App\Domains\Courses\Repositories;

use App\Models\CourseProgress;
use Illuminate\Database\Eloquent\Collection;

final class EloquentCourseProgressRepository implements CourseProgressRepositoryInterface
{
    public function find(string $id): ?CourseProgress
    {
        return CourseProgress::query()
            ->find($id);
    }

    public function findOrFail(string $id): CourseProgress
    {
        return CourseProgress::query()
            ->findOrFail($id);
    }

    public function findByUserAndCourse(
        int $userId,
        string $courseId
    ): ?CourseProgress {
        return CourseProgress::query()
            ->where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();
    }

    public function findByUser(int $userId): Collection
    {
        return CourseProgress::query()
            ->where('user_id', $userId)
            ->latest('completed_at')
            ->get();
    }

    public function findByCourse(string $courseId): Collection
    {
        return CourseProgress::query()
            ->where('course_id', $courseId)
            ->latest('completed_at')
            ->get();
    }

    public function create(array $data): CourseProgress
    {
        return CourseProgress::query()
            ->create($data);
    }

   public function update(
    CourseProgress $progress,
    array $data
): CourseProgress {
    $progress->update($data);

    return CourseProgress::query()
        ->findOrFail($progress->id);
}
}
