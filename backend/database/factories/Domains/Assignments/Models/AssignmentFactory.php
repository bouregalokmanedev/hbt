<?php

namespace Database\Factories\Domains\Assignments\Models;

use App\Domains\Assignments\Enums\AssignmentStatus;
use App\Domains\Assignments\Models\Assignment;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

final class AssignmentFactory extends Factory
{
    protected $model = Assignment::class;

    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),
            'title' => fake()->sentence(4),
            'slug' => fake()->unique()->slug(),
            'instructions' => fake()->paragraph(),
            'max_points' => 100,
            'allow_late_submissions' => true,
            'due_at' => now()->addWeek(),
            'status' => AssignmentStatus::DRAFT,
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AssignmentStatus::PUBLISHED,
            'published_at' => now(),
        ]);
    }
}
