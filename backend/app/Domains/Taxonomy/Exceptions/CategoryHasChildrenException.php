<?php

namespace App\Domains\Taxonomy\Exceptions;

use App\Core\Domain\Exceptions\DomainException;

class CategoryHasChildrenException extends DomainException
{
    public function __construct(
        string $message = 'Category has child categories.'
    ) {
        parent::__construct($message);
    }
}