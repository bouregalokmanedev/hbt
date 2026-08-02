<?php

namespace App\Domains\Taxonomy\Actions;

use App\Core\Domain\Actions\BaseAction;
use App\Domains\Taxonomy\DTOs\UpdateCategoryData;
use App\Domains\Taxonomy\Services\CategoryService;

class UpdateCategoryAction extends BaseAction
{
    public function __construct(
        private readonly CategoryService $service
    ) {}

    public function execute(UpdateCategoryData $dto)
    {
        return $this->service->update($dto);
    }
}