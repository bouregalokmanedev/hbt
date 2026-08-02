<?php

namespace App\Domains\Taxonomy\Listeners;

use App\Domains\Taxonomy\Events\CategoryCreated;
use App\Domains\Taxonomy\Events\CategoryUpdated;
use App\Domains\Taxonomy\Events\CategoryDeleted;
use App\Domains\Taxonomy\Services\CategoryCacheService;

final class InvalidateCategoryCache
{
    public function __construct(
        private readonly CategoryCacheService $cache
    ) {}

    public function handle(
        CategoryCreated|CategoryUpdated|CategoryDeleted $event
    ): void {

        $this->cache->forget();
    }
}