<?php

namespace App\Domains\StudentAssessments\Exceptions;

final class AttemptLimitExceededException extends StudentAssessmentException
{
    public function __construct(string $message = 'Maximum attempts exceeded.')
    {
        parent::__construct($message);
    }
}
