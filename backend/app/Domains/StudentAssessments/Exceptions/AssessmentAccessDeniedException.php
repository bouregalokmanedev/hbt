<?php

namespace App\Domains\StudentAssessments\Exceptions;

final class AssessmentAccessDeniedException extends StudentAssessmentException
{
    public function __construct(string $message = 'Access to this assessment is denied.')
    {
        parent::__construct($message);
    }
}
