<?php

namespace App\Domains\Assessments\Exceptions;

use RuntimeException;

final class AssessmentNotEligibleException extends RuntimeException
{
    public function __construct(
        public readonly array $evidence = [],
    ) {
        parent::__construct(
            'User is not eligible to start this assessment.'
        );
    }
}