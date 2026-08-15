<?php

namespace App\Domains\Lessons\Exceptions;

use RuntimeException;

final class LessonCannotBeCompletedException extends RuntimeException
{
    public function render($request)
    {
        return response()->json([
            'message' => $this->getMessage(),
        ], 403);
    }
}