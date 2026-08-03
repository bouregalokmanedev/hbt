<?php

namespace App\Domains\Courses\Actions;

use App\Domains\Courses\Repositories\SectionRepositoryInterface;
use App\Domains\Courses\Services\SectionService;
use App\Models\Section;
use Illuminate\Support\Facades\DB;
use App\Domains\Courses\Events\SectionCreated;

final class CreateSectionAction
{
    public function __construct(
        private readonly SectionRepositoryInterface $repository,
        private readonly SectionService $service,
    ) {}

    public function execute(array $data): Section
    {
        return DB::transaction(function () use ($data) {

    $section = $this->repository->create($data);

    $this->service->validate($section);

    SectionCreated::dispatch($section);

    return $section;
});
    }
}