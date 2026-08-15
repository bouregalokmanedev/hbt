<?php

namespace App\Domains\Lessons\Repositories;

use App\Models\LessonProgress;
use Illuminate\Database\Eloquent\Collection;

interface LessonProgressRepositoryInterface
{
    public function find(
        string $id
    ): ?LessonProgress;

    public function findOrFail(
        string $id
    ): LessonProgress;

    public function findByUserAndLesson(
        int $userId,
        string $lessonId
    ): ?LessonProgress;

    public function findByUser(
        int $userId
    ): Collection;

    public function findByLesson(
        string $lessonId
    ): Collection;

    public function create(
        array $data
    ): LessonProgress;

    public function update(
        LessonProgress $progress,
        array $data
    ): LessonProgress;
}