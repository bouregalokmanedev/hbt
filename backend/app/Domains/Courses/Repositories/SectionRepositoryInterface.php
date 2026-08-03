<?php

namespace App\Domains\Courses\Repositories;

use App\Models\Section;
use Illuminate\Database\Eloquent\Collection;

interface SectionRepositoryInterface
{
    public function find(string $id): ?Section;

    public function findOrFail(string $id): Section;

    public function findByCourse(
        string $courseId
    ): Collection;

    public function findByCourseAndPosition(
        string $courseId,
        int $position
    ): ?Section;

    public function create(
        array $data
    ): Section;

    public function update(
        Section $section,
        array $data
    ): Section;

    public function delete(
        Section $section
    ): void;

    public function shiftPositions(
    string $courseId,
    int $fromPosition,
    int $toPosition
): void;
}