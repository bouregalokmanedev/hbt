<?php

namespace Database\Factories;

use App\Enums\LessonStatus;
use App\Models\Section;
use Illuminate\Database\Eloquent\Factories\Factory;

class LessonFactory extends Factory
{
    public function definition(): array
    {
        return [
            'section_id' => Section::factory(),

            'title' => fake()->sentence(4),

            'slug' => fake()->unique()->slug(),

            'description' => fake()->optional()->paragraph(),

            'content' => fake()->optional()->paragraphs(
                2,
                true
            ),

            'position' => 1,

            'status' => LessonStatus::DRAFT,
        ];
    }
}