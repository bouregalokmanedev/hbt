<?php

namespace App\Domains\Assessments\Exceptions;

use RuntimeException;

final class AssessmentMaxAttemptsExceededException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct(
            'The maximum number of attempts for this assessment has been reached.'
        );
    }
}