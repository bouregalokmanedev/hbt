<?php

namespace App\Domains\Courses\Exceptions;

use DomainException;

final class SectionCannotBePublished extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'The section does not satisfy the requirements for publication.'
        );
    }
}