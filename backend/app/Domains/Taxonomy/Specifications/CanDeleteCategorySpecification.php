<?php

namespace App\Domains\Taxonomy\Specifications;

use App\Models\Category;

class CanDeleteCategorySpecification
{
    public function hasChildren(
        Category $category
    ): bool {

        return $category
            ->children()
            ->exists();

    }

    public function hasCourses(
        Category $category
    ): bool {

        return $category
            ->courses()
            ->exists();

    }

    public function isRoot(
        Category $category
    ): bool {

        return $category->parent_id === null;

    }
}