<?php

namespace App\Domains\Courses\Exceptions;

use DomainException;

final class InvalidSectionPosition extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Section position must be greater than or equal to 1.'
        );
    }
}