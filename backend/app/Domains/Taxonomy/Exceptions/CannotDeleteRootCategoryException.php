<?php

namespace App\Domains\Taxonomy\Exceptions;

use App\Core\Domain\Exceptions\DomainException;

class CannotDeleteRootCategoryException extends DomainException
{
    public function __construct(
        string $message = 'Root category cannot be deleted.'
    ) {
        parent::__construct($message);
    }
}