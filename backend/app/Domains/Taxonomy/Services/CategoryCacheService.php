<?php

namespace App\Domains\Taxonomy\Services;

use App\Models\Category;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

final class CategoryCacheService
{
    private const TREE_KEY = 'taxonomy.categories.tree';

    private const ROOTS_KEY = 'taxonomy.categories.roots';

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
    }
}