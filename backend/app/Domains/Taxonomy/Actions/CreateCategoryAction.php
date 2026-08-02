<?php

namespace App\Domains\Taxonomy\Actions;

use App\Core\Domain\Actions\BaseAction;
use App\Domains\Taxonomy\DTOs\CreateCategoryData;
use App\Domains\Taxonomy\Services\CategoryService;

class CreateCategoryAction extends BaseAction
{
    public function __construct(

        private readonly CategoryService $service

    ){}

    public function execute(

        CreateCategoryData $dto

    ){

        return $this->service

            ->create($dto);

    }
}