<?php

namespace App\Domains\Taxonomy\Exceptions;

use App\Core\Domain\Exceptions\DomainException;

class CategoryAlreadyExistsException extends DomainException
{
    public function __construct(
        string $message = 'Category already exists.'
    ) {
        parent::__construct($message);
    }
}