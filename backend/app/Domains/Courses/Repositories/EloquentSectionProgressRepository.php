<?php

namespace App\Domains\Courses\Repositories;

use App\Models\SectionProgress;
use Illuminate\Database\Eloquent\Collection;

final class EloquentSectionProgressRepository implements SectionProgressRepositoryInterface
{
    public function find(string $id): ?SectionProgress
    {
        return SectionProgress::query()->find($id);
    }

    public function findOrFail(string $id): SectionProgress
    {
        return SectionProgress::query()->findOrFail($id);
    }

    public function findByUserAndSection(
        int $userId,
        string $sectionId
    ): ?SectionProgress {
        return SectionProgress::query()
            ->where('user_id', $userId)
            ->where('section_id', $sectionId)
            ->first();
    }

    public function findByUser(int $userId): Collection
    {
        return SectionProgress::query()
            ->where('user_id', $userId)
            ->latest('completed_at')
            ->get();
    }

    public function findBySection(string $sectionId): Collection
    {
        return SectionProgress::query()
            ->where('section_id', $sectionId)
            ->latest('completed_at')
            ->get();
    }

    public function create(array $data): SectionProgress
    {
        return SectionProgress::query()->create($data);
    }

    public function update(
        SectionProgress $progress,
        array $data
    ): SectionProgress {
        $progress->update($data);

        return $progress->refresh();
    }
}