<?php

namespace Database\Factories;

use App\Models\Bootcamp;
use App\Models\BootcampSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BootcampSection>
 */
class BootcampSectionFactory extends Factory
{
    protected $model = BootcampSection::class;

    public function definition(): array
    {
        return [
            'bootcamp_id' => Bootcamp::factory(),
            'title' => fake()->unique()->sentence(4),
            'position' => fake()->numberBetween(1, 10),
        ];
    }
}
