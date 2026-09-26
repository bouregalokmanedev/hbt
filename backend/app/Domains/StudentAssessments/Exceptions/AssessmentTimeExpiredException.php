<?php

namespace App\Domains\StudentAssessments\Exceptions;

final class AssessmentTimeExpiredException extends StudentAssessmentException
{
    public function __construct(string $message = 'Assessment time has expired.')
    {
        parent::__construct($message);
    }
}
