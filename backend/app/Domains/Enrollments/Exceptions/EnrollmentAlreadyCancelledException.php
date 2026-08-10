<?php

namespace App\Domains\Enrollments\Exceptions;

use DomainException;

final class EnrollmentAlreadyCancelledException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'The enrollment is already cancelled.'
        );
    }
}
