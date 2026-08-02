<?php

namespace App\Domains\Taxonomy\Exceptions;

use App\Core\Domain\Exceptions\DomainException;

class CircularCategoryHierarchyException extends DomainException
{
    public function __construct(
        string $message = 'Circular category hierarchy detected.'
    ) {
        parent::__construct($message);
    }
}