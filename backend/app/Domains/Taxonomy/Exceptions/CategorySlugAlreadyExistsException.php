<?php

namespace App\Domains\Taxonomy\Exceptions;

use App\Core\Domain\Exceptions\DomainException;

class CategorySlugAlreadyExistsException extends DomainException
{
    public function __construct(
        string $message = 'Category slug already exists.'
    ) {
        parent::__construct($message);
    }
}