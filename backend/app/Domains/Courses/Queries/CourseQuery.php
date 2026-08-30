<?php

namespace App\Domains\Courses\Queries;

use App\Core\Query\Query;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;

class CourseQuery extends Query
{


    public static function make(): static
    {
        return new static();
    }

    public function status(string $status): static
{
    return $this->add(
        'status',
        $status
    );
}
    public function published(): static
    {
        return $this->add(
            'status',
            CourseStatus::PUBLISHED->value
        );
    }

    public function public(): static
    {
        return $this->add(
            'visibility',
            Visibility::PUBLIC->value
        );
    }

    public function catalog(): static
    {
        return $this
            ->published()
            ->public();
    }

   public function byInstructor(string $id): static
{
    return $this->add('instructor', $id);
}

    public function difficulty(
        Difficulty $difficulty
    ): static {
        return $this->add(
            'difficulty',
            $difficulty->value
        );
    }

    public function search(string $text): static
    {
        return $this->add(
            'search',
            $text
        );
    }

    public function free(): static
    {
        return $this->add('free', true);
    }

    public function visibility(string $visibility): static
    {
        return $this->add(
            'visibility',
            $visibility
        );
    }

    public function language(string $language): static
    {
        return $this->add(
            'language',
            $language
        );
    }

    public function category(int|string $categoryId): static
    {
        return $this->add(
            'category',
            $categoryId
        );
    }

}
