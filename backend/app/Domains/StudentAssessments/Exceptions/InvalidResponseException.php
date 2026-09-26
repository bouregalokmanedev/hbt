<?php

namespace App\Domains\StudentAssessments\Exceptions;

final class InvalidResponseException extends StudentAssessmentException
{
    public function __construct(string $message = 'Invalid response.', public readonly array $errors = [])
    {
        parent::__construct($message);
    }
}
