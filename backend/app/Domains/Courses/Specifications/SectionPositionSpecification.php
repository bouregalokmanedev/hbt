<?php

namespace App\Domains\Courses\Specifications;

class SectionPositionSpecification
{
    public function isSatisfiedBy(int $position): bool
    {
        return $position > 0;
    }
}