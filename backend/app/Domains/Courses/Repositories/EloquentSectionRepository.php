<?php

namespace App\Domains\Courses\Repositories;

use App\Models\Section;
use Illuminate\Database\Eloquent\Collection;

final class EloquentSectionRepository implements SectionRepositoryInterface
{
    public function find(string $id): ?Section
    {
        return Section::query()
            ->find($id);
    }

    public function findOrFail(string $id): Section
    {
        return Section::query()
            ->findOrFail($id);
    }

    public function findByCourse(
        string $courseId
    ): Collection {
        return Section::query()
            ->where('course_id', $courseId)
            ->orderBy('position')
            ->get();
    }

    public function findByCourseAndPosition(
        string $courseId,
        int $position
    ): ?Section {
        return Section::query()
            ->where('course_id', $courseId)
            ->where('position', $position)
            ->first();
    }

    public function create(
        array $data
    ): Section {
        return Section::query()
            ->create($data);
    }

    public function update(
        Section $section,
        array $data
    ): Section {
        $section->update($data);

        return $section->fresh();
    }

    public function delete(
        Section $section
    ): void {
        $section->delete();
    }
    public function shiftPositions(
    string $courseId,
    int $fromPosition,
    int $toPosition
): void {
    if ($fromPosition === $toPosition) {
        return;
    }

    if ($toPosition < $fromPosition) {

        Section::query()
            ->where('course_id', $courseId)
            ->where('position', '>=', $toPosition)
            ->where('position', '<', $fromPosition)
            ->increment('position');

        return;
    }

    Section::query()
        ->where('course_id', $courseId)
        ->where('position', '>', $fromPosition)
        ->where('position', '<=', $toPosition)
        ->decrement('position');
}
}