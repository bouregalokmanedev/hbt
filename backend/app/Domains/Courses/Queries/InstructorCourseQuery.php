<?php

namespace App\Domains\Courses\Queries;

use App\Core\Query\Query;
use App\Enums\Courses\Difficulty;

final class InstructorCourseQuery extends Query
{
    public static function make(): static
    {
        return new static();
    }

    public function forInstructor(int $instructorId): static
    {
        return $this->add('instructor', $instructorId);
    }

    public function search(string $text): static
    {
        return $this->add('search', $text);
    }

    public function status(string $status): static
    {
        return $this->add('status', $status);
    }

    public function difficulty(Difficulty $difficulty): static
    {
        return $this->add(
            'difficulty',
            $difficulty->value
        );
    }

    public function free(): static
    {
        return $this->add('free', true);
    }
}