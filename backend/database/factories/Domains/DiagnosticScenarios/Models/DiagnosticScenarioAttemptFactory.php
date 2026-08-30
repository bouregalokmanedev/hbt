<?php

namespace Database\Factories\Domains\DiagnosticScenarios\Models;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiagnosticScenarioAttempt>
 */
final class DiagnosticScenarioAttemptFactory extends Factory
{
    protected $model = DiagnosticScenarioAttempt::class;

    public function definition(): array
    {
        return [
            'diagnostic_scenario_id' => DiagnosticScenario::factory(),

            'user_id' => User::factory(),

            'attempt_number' => fake()->numberBetween(1, 3),

            'status' => DiagnosticScenarioAttemptStatus::IN_PROGRESS,

            'score' => null,

            'passed' => false,

            'evidence' => [],

            'started_at' => now(),

            'completed_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (): array => [
            'status' => DiagnosticScenarioAttemptStatus::COMPLETED,

            'score' => fake()->numberBetween(0, 100),

            'passed' => true,

            'completed_at' => now(),
        ]);
    }

    public function passed(): static
    {
        return $this->state(fn (): array => [
            'status' => DiagnosticScenarioAttemptStatus::COMPLETED,

            'score' => fake()->numberBetween(70, 100),

            'passed' => true,

            'completed_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (): array => [
            'status' => DiagnosticScenarioAttemptStatus::COMPLETED,

            'score' => fake()->numberBetween(0, 69),

            'passed' => false,

            'completed_at' => now(),
        ]);
    }

    public function forScenario(
        DiagnosticScenario $scenario
    ): static {
        return $this->state(fn (): array => [
            'diagnostic_scenario_id' => $scenario->id,
        ]);
    }

    public function forUser(User $user): static
    {
        return $this->state(fn (): array => [
            'user_id' => $user->id,
        ]);
    }

    public function withEvidence(array $evidence): static
    {
        return $this->state(fn (): array => [
            'evidence' => $evidence,
        ]);
    }

    public function attempt(int $number): static
    {
        return $this->state(fn (): array => [
            'attempt_number' => $number,
        ]);
    }
}