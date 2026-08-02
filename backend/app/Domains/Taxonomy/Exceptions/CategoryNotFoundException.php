<?php

namespace App\Domains\Taxonomy\Exceptions;

use App\Core\Domain\Exceptions\DomainException;

class CategoryNotFoundException extends DomainException
{
    public function __construct(
        string $message = 'Category not found.'
    ) {
        parent::__construct($message);
    }
}