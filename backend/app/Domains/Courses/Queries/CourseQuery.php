<?php

namespace App\Domains\Courses\Queries;

use App\Core\Query\Query;
use App\Enums\Courses\Difficulty;

class CourseQuery extends Query
{
    public static function make(): static
    {
        return new static();
    }

    public function published(): static
    {
        return $this->add('status', 'published');
    }

    public function byInstructor(int $id): static
    {
        return $this->add('instructor', $id);
    }

    public function difficulty(
        Difficulty $difficulty
    ): static {

        return $this->add(
            'difficulty',
            $difficulty
        );

    }

    public function search(
        string $text
    ): static {

        return $this->add(
            'search',
            $text
        );

    }

    public function free(): static
    {
        return $this->add('free', true);
    }

    public function visibility(
        string $visibility
    ): static {

        return $this->add(
            'visibility',
            $visibility
        );

    }
}