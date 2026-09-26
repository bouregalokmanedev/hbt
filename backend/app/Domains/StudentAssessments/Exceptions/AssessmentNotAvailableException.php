<?php

namespace App\Domains\StudentAssessments\Exceptions;

final class AssessmentNotAvailableException extends StudentAssessmentException
{
    public function __construct(string $message = 'Assessment is not available.', public readonly array $evidence = [])
    {
        parent::__construct($message);
    }
}
