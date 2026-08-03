<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\Events\SectionPublished;
use App\Domains\Courses\Repositories\SectionRepositoryInterface;
use App\Domains\Courses\Services\SectionService;
use App\Enums\SectionStatus;
use App\Models\Section;
use Illuminate\Support\Facades\DB;

final class PublishSectionAction
{
    public function __construct(
        private readonly SectionRepositoryInterface $repository,
        private readonly SectionService $service,
    ) {}

    public function execute(Section $section): Section
    {
        return DB::transaction(function () use ($section) {

            $section->status = SectionStatus::PUBLISHED;

            $this->service->validate($section);

            $published = $this->repository->update(
                $section,
                [
                    'status' => SectionStatus::PUBLISHED,
                ]
            );

            SectionPublished::dispatch($published);

            return $published;
        });
    }
}