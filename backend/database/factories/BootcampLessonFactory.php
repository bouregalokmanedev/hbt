<?php

namespace Database\Factories;

use App\Models\BootcampLesson;
use App\Models\BootcampSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BootcampLesson>
 */
class BootcampLessonFactory extends Factory
{
    protected $model = BootcampLesson::class;

    public function definition(): array
    {
        return [
            'bootcamp_section_id' => BootcampSection::factory(),
            'title' => fake()->unique()->sentence(5),
            'classroom_count' => fake()->numberBetween(1, 20),
            'duration_minutes' => fake()->numberBetween(30, 240),
            'position' => fake()->numberBetween(1, 20),
        ];
    }
}
