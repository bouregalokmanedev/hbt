<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\Repositories\SectionRepositoryInterface;
use App\Models\Section;
use App\Enums\SectionStatus;
use Illuminate\Support\Facades\DB;
use App\Domains\Courses\Events\SectionUnpublished;

final class UnpublishSectionAction
{
    public function __construct(
        private readonly SectionRepositoryInterface $repository,
    ) {}

    public function execute(Section $section): Section
    {
        return DB::transaction(function () use ($section) {
           $unpublished = $this->repository->update(
    $section,
    [
        'status' => SectionStatus::DRAFT,
    ]
);

SectionUnpublished::dispatch($unpublished);

return $unpublished;
        });
    }
}