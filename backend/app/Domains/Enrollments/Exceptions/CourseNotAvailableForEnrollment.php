<?php

namespace App\Domains\Enrollments\Exceptions;

use DomainException;

final class CourseNotAvailableForEnrollment extends DomainException
{
    public function __construct()
    {
        parent::__construct(
            'The course is not available for enrollment.'
        );
    }
}
