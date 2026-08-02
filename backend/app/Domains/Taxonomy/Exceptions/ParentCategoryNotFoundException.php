<?php

namespace App\Domains\Taxonomy\Exceptions;

use App\Core\Domain\Exceptions\DomainException;

class ParentCategoryNotFoundException extends DomainException
{
    public function __construct(
        string $message = 'Parent category was not found.'
    ) {
        parent::__construct($message);
    }
}