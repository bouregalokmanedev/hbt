<?php

namespace App\Domains\Taxonomy\Actions;

use App\Domains\Taxonomy\DTOs\DetachCategoryFromCourseData;
use App\Domains\Taxonomy\Services\CategoryService;

class DetachCategoryFromCourseAction
{
    public function __construct(
        private readonly CategoryService $service
    ) {}

    public function execute(
        DetachCategoryFromCourseData $dto
    ): void {
        $this->service->detachCourse($dto);
    }
}