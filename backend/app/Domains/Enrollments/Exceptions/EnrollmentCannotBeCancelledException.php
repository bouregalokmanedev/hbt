<?php

namespace App\Domains\Enrollments\Exceptions;

use DomainException;

final class EnrollmentCannotBeCancelledException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'Only an active enrollment can be cancelled.'
        );
    }
}
