<?php

namespace App\Domains\Taxonomy\Services;

use App\Models\Category;
use Illuminate\Support\Collection;

class TreeService
{
    /**
     * Return root categories with children eager loaded.
     */
  public function roots(): Collection
{
    return Category::query()
        ->whereNull('parent_id')
        ->with([
            'children' => function ($query) {
                $query
                    ->orderBy('sort_order')
                    ->with([
                        'children' => function ($query) {
                            $query
                                ->orderBy('sort_order')
                                ->with('children');
                        },
                    ]);
            },
        ])
        ->orderBy('sort_order')
        ->get();
}

    /**
     * Return direct children.
     */
    public function children(
        Category $category
    ): Collection {

        return $category
            ->children()
            ->orderBy('sort_order')
            ->get();

    }
    public function breadcrumb(
    Category $category
): Collection
{
    $items = collect();

    while ($category) {

        $items->prepend($category);

        $category = $category->parent;

    }

    return $items;
}
}