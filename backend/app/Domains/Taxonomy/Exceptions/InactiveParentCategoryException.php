<?php

namespace App\Domains\Taxonomy\Exceptions;

use App\Core\Domain\Exceptions\DomainException;

class InactiveParentCategoryException extends DomainException
{
    public function __construct(
        string $message = 'Parent category is inactive.'
    ) {
        parent::__construct($message);
    }
}