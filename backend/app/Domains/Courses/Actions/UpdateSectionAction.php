<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\Repositories\SectionRepositoryInterface;
use App\Domains\Courses\Services\SectionService;
use App\Models\Section;
use Illuminate\Support\Facades\DB;
use App\Domains\Courses\Exceptions\SectionStatusCannotBeChanged;
use App\Domains\Courses\Events\SectionUpdated;

final class UpdateSectionAction
{
    public function __construct(
        private readonly SectionRepositoryInterface $repository,
        private readonly SectionService $service,
    ) {}

    public function execute(
    Section $section,
    array $data
): Section {
    if (array_key_exists('status', $data)) {
        throw new SectionStatusCannotBeChanged();
    }

    return DB::transaction(function () use ($section, $data) {
       $updated = $this->repository->update(
    $section,
    $data
);

$this->service->validate($updated);

SectionUpdated::dispatch($updated);

return $updated;
    });
}
}