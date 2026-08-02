<?php

namespace App\Domains\Taxonomy\Specifications;

use App\Models\Category;

class ValidParentSpecification
{
    public function isSatisfiedBy(
        ?Category $parent
    ): bool {

        if (!$parent) {

            return true;

        }

        return $parent->is_active;
    }
}