<?php

namespace App\Domains\StudentAssessments\Exceptions;

final class AttemptAlreadySubmittedException extends StudentAssessmentException
{
    public function __construct(string $message = 'Attempt has already been submitted.')
    {
        parent::__construct($message);
    }
}
