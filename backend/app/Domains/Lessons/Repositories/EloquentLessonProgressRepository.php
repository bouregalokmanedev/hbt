<?php

namespace App\Domains\Lessons\Repositories;

use App\Models\LessonProgress;
use Illuminate\Database\Eloquent\Collection;

final class EloquentLessonProgressRepository implements LessonProgressRepositoryInterface
{
    public function find(
        string $id
    ): ?LessonProgress {
        return LessonProgress::query()
            ->find($id);
    }

    public function findOrFail(
        string $id
    ): LessonProgress {
        return LessonProgress::query()
            ->findOrFail($id);
    }

    public function findByUserAndLesson(
        int $userId,
        string $lessonId
    ): ?LessonProgress {
        return LessonProgress::query()
            ->where('user_id', $userId)
            ->where('lesson_id', $lessonId)
            ->first();
    }

    public function findByUser(
        int $userId
    ): Collection {
        return LessonProgress::query()
            ->where('user_id', $userId)
            ->latest('completed_at')
            ->get();
    }

    public function findByLesson(
        string $lessonId
    ): Collection {
        return LessonProgress::query()
            ->where('lesson_id', $lessonId)
            ->latest('completed_at')
            ->get();
    }

    public function create(
        array $data
    ): LessonProgress {
        return LessonProgress::query()
            ->create($data);
    }

    public function update(
        LessonProgress $progress,
        array $data
    ): LessonProgress {
        $progress->update($data);

        return $progress->refresh();
    }
}