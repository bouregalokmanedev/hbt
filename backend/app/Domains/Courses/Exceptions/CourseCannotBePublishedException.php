<?php

namespace App\Domains\Courses\Exceptions;

use RuntimeException;

class CourseCannotBePublishedException extends RuntimeException
{
    public static function because(string $reason): self
    {
        return new self($reason);
    }
}