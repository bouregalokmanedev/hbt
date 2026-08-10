<?php

namespace App\Domains\Enrollments\Exceptions;

use DomainException;

final class AlreadyEnrolledException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'The student is already enrolled in this course.'
        );
    }
}
