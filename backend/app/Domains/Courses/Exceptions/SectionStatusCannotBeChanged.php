<?php

namespace App\Domains\Courses\Exceptions;

use DomainException;

final class SectionStatusCannotBeChanged extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Section status must be changed through the publication workflow.'
        );
    }
}