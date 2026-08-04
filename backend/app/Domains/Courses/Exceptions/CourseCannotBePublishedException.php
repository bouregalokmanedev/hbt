<?php

namespace App\Domains\Courses\Exceptions;

use RuntimeException;

final class CourseCannotBePublishedException extends RuntimeException
{
    public static function because(string $reason): self
    {
        return new self($reason);
    }
}