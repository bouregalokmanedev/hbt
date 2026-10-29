<?php

namespace Database\Factories;

use App\Models\Bootcamp;
use App\Models\BootcampSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BootcampSchedule>
 */
class BootcampScheduleFactory extends Factory
{
    protected $model = BootcampSchedule::class;

    public function definition(): array
    {
        return [
            'bootcamp_id' => Bootcamp::factory(),
            'starts_at' => now()->addWeeks(2)->toDateString(),
            'ends_at' => now()->addWeeks(6)->toDateString(),
        ];
    }
}
