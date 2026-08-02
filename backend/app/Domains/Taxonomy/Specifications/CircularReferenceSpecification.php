<?php

namespace App\Domains\Taxonomy\Specifications;

use App\Models\Category;

final class CircularReferenceSpecification
{
    public function isSatisfiedBy(
        Category $category,
        ?string $parentId
    ): bool {
        // Moving a category to the root is always valid.
        if ($parentId === null) {
            return true;
        }

        // A category cannot be its own parent.
        if ((string) $category->getKey() === (string) $parentId) {
            return false;
        }

        // Find the proposed parent.
        $parent = Category::query()->find($parentId);

        // Parent existence is handled separately by validation.
        if ($parent === null) {
            return true;
        }

        // Walk up the hierarchy.
        while ($parent !== null) {
            // If we eventually reach the category we're moving,
            // the new parent would create a circular hierarchy.
            if ((string) $parent->getKey() === (string) $category->getKey()) {
                return false;
            }

            $parent = $parent->parent;
        }

        return true;
    }
}