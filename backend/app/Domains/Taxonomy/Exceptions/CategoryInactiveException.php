<?php

namespace App\Domains\Taxonomy\Exceptions;

use App\Core\Domain\Exceptions\DomainException;

class CategoryInactiveException extends DomainException
{
    public function __construct(
        string $message = 'Category is inactive.'
    ) {
        parent::__construct($message);
    }
}