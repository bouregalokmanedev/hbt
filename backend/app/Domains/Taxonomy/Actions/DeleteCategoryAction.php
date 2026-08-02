<?php

namespace App\Domains\Taxonomy\Actions;

use App\Core\Domain\Actions\BaseAction;
use App\Domains\Taxonomy\Services\CategoryService;

final class DeleteCategoryAction extends BaseAction
{
    public function __construct(
        private readonly CategoryService $service
    ) {}

    public function execute(
        string $categoryId
    ): void {

        $this->service->delete(
            $categoryId
        );

    }
}