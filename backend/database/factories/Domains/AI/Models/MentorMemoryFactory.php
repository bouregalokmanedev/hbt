<?php

namespace Database\Factories\Domains\AI\Models;

use App\Domains\AI\Enums\MentorMemoryType;
use App\Domains\AI\Models\MentorMemory;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MentorMemory>
 */
class MentorMemoryFactory extends Factory
{
    protected $model = MentorMemory::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'course_id' => null,

            'type' => fake()->randomElement(
                MentorMemoryType::cases()
            ),

            'key' => fake()->unique()->word(),

            'value' => fake()->sentence(),

            'confidence' => fake()->randomFloat(
                4,
                0,
                1
            ),

            'source' => fake()->optional()->randomElement([
                'conversation',
                'assessment',
                'quiz',
                'manual',
            ]),

            'last_used_at' => now(),

            'expires_at' => null,
        ];
    }
}