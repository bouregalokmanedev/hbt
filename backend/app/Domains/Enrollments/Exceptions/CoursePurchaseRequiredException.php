<?php

namespace App\Domains\Enrollments\Exceptions;

use DomainException;

final class CoursePurchaseRequiredException extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'This course requires a completed purchase or an active subscription.'
        );
    }
}
