<?php

namespace App\Domains\Taxonomy\Actions;

use App\Domains\Taxonomy\DTOs\AttachCategoryToCourseData;
use App\Domains\Taxonomy\Services\CategoryService;

class AttachCategoryToCourseAction
{
    public function __construct(
        private readonly CategoryService $service,
    ) {}

    public function execute(
        AttachCategoryToCourseData $dto
    ): void {
        $this->service->attachCourse($dto);
    }
}