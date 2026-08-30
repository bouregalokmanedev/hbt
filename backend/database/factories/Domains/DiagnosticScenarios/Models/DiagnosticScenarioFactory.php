<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<DiagnosticScenario>
 */
final class DiagnosticScenarioFactory extends Factory
{
    protected $model = DiagnosticScenario::class;

    public function definition(): array
    {
        $title = fake()->sentence(4);

        return [
            'course_id' => Course::factory(),

            'title' => $title,

            'slug' => Str::slug($title) . '-' . fake()->unique()->numberBetween(1, 999999),

            'description' => fake()->paragraph(),

            'status' => DiagnosticScenarioStatus::DRAFT,

            'position' => fake()->numberBetween(1, 10),

            'passing_score' => 70,

            'is_required' => true,

            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn (): array => [
            'status' => DiagnosticScenarioStatus::PUBLISHED,

            'published_at' => now(),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn (): array => [
            'status' => DiagnosticScenarioStatus::DRAFT,

            'published_at' => null,
        ]);
    }

    public function required(): static
    {
        return $this->state(fn (): array => [
            'is_required' => true,
        ]);
    }

    public function optional(): static
    {
        return $this->state(fn (): array => [
            'is_required' => false,
        ]);
    }

    public function forCourse(Course $course): static
    {
        return $this->state(fn (): array => [
            'course_id' => $course->id,
        ]);
    }
}