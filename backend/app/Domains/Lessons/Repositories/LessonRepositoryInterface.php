<?php

namespace App\Domains\Lessons\Repositories;

use App\Models\Lesson;
use Illuminate\Database\Eloquent\Collection;

interface LessonRepositoryInterface
{
    public function find(string $id): ?Lesson;

    public function findOrFail(string $id): Lesson;

    public function findBySection(
        string $sectionId
    ): Collection;

    public function findBySectionAndPosition(
        string $sectionId,
        int $position
    ): ?Lesson;

    public function create(
        array $data
    ): Lesson;

    public function update(
        Lesson $lesson,
        array $data
    ): Lesson;

    public function delete(
        Lesson $lesson
    ): void;

    public function shiftPositions(
        string $sectionId,
        int $fromPosition,
        int $toPosition
    ): void;

public function countBySection(
    string $sectionId
): int;
}