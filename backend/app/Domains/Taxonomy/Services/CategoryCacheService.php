<?php

namespace App\Domains\Taxonomy\Services;

use App\Models\Category;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

final class CategoryCacheService
{
    public const TREE_KEY = 'taxonomy.categories.tree';

    public const ROOTS_KEY = 'taxonomy.categories.roots';

    public const ACTIVE_KEY = 'categories.active';

    public const INACTIVE_KEY = 'categories.inactive';

    public const LEAVES_KEY = 'categories.leaves';

    public function tree(): Collection
    {
        return Cache::remember(
            self::TREE_KEY,
            now()->addHour(),
            fn () => Category::query()
                ->whereNull('parent_id')
                ->with('children')
                ->orderBy('sort_order')
                ->get()
        );
    }

    public function roots(): Collection
    {
        return Cache::remember(
            self::ROOTS_KEY,
            now()->addHour(),
            fn () => Category::query()
                ->whereNull('parent_id')
                ->orderBy('sort_order')
                ->get()
        );
    }

    public function forget(): void
    {
        Cache::forget(self::TREE_KEY);
        Cache::forget(self::ROOTS_KEY);
        Cache::forget(self::ACTIVE_KEY);
        Cache::forget(self::INACTIVE_KEY);
        Cache::forget(self::LEAVES_KEY);
    }
}