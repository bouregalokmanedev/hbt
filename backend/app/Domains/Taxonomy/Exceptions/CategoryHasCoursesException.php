<?php

namespace App\Domains\Taxonomy\Exceptions;

use App\Core\Domain\Exceptions\DomainException;

class CategoryHasCoursesException extends DomainException
{
    public function __construct(
        string $message = 'Category is assigned to one or more courses.'
    ) {
        parent::__construct($message);
    }
}