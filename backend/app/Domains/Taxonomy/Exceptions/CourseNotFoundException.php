<?php

namespace App\Domains\Taxonomy\Exceptions;

use RuntimeException;

class CourseNotFoundException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Course not found.');
    }
}