<?php

namespace Database\Factories;

use App\Enums\SectionStatus;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

class SectionFactory extends Factory
{
    public function definition(): array
    {
        $title = fake()->unique()->sentence(3);

        return [
            'course_id' => Course::factory(),

            'title' => $title,

            'slug' => fake()->unique()->slug(),

            'description' => fake()->optional()->paragraph(),

            'position' => fake()->numberBetween(
                1,
                10
            ),

            'status' => SectionStatus::DRAFT,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => SectionStatus::PUBLISHED,
        ]);
    }
}