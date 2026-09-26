<?php

namespace Database\Factories;

use App\Domains\Assessments\Models\Competency;
use App\Models\Lesson;
use Illuminate\Database\Eloquent\Factories\Factory;

final class CompetencyLessonFactory extends Factory
{
    public function definition(): array
    {
        return [
            'competency_id' => Competency::factory(),
            'lesson_id' => Lesson::factory(),
            'relevance_score' => fake()->numberBetween(50, 100),
            'coverage_type' => fake()->randomElement(['primary', 'reinforcement', 'assessment']),
        ];
    }

    public function primary(): static
    {
        return $this->state(fn () => ['coverage_type' => 'primary']);
    }
}