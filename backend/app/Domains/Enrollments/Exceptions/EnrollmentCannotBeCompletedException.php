<?php

namespace App\Domains\Enrollments\Exceptions;

use DomainException;

final class EnrollmentCannotBeCompletedException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Only an active enrollment can be completed.'
        );
    }
}
