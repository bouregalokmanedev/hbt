<?php

namespace App\Domains\Courses\Repositories;

use App\Models\SectionProgress;
use Illuminate\Database\Eloquent\Collection;

interface SectionProgressRepositoryInterface
{
    public function find(string $id): ?SectionProgress;

    public function findOrFail(string $id): SectionProgress;

    public function findByUserAndSection(
        int $userId,
        string $sectionId
    ): ?SectionProgress;

    public function findByUser(int $userId): Collection;

    public function findBySection(string $sectionId): Collection;

    public function create(array $data): SectionProgress;

    public function update(
        SectionProgress $progress,
        array $data
    ): SectionProgress;
}