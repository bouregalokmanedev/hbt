<?php

namespace App\Domains\Taxonomy\Listeners;

use App\Domains\Taxonomy\Events\CategoryAttachedToCourse;
use App\Domains\Taxonomy\Events\CategoryDetachedFromCourse;
use App\Domains\Taxonomy\Services\CategoryCacheService;

final class InvalidateCourseCategoryCache
{
    public function __construct(
        private readonly CategoryCacheService $cache
    ) {}

    public function handle(
        CategoryAttachedToCourse|CategoryDetachedFromCourse $event
    ): void {
        // Category listings embed course counts and the course's own
        // category list is cached by the API consumers, so both sides must
        // drop their memoized copy when the pivot changes.
        $this->cache->forget();
    }
}
