<?php

namespace Database\Factories\Domains\Assignments\Models;

use App\Domains\Assignments\Enums\AssignmentSubmissionStatus;
use App\Domains\Assignments\Models\Assignment;
use App\Domains\Assignments\Models\AssignmentSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

final class AssignmentSubmissionFactory extends Factory
{
    protected $model = AssignmentSubmission::class;

    public function definition(): array
    {
        return [
            'assignment_id' => Assignment::factory(),
            'user_id' => User::factory(),
            'content' => fake()->paragraph(),
            'link_url' => null,
            'status' => AssignmentSubmissionStatus::SUBMITTED,
            'grade' => null,
            'feedback' => null,
            'submitted_at' => now(),
            'graded_at' => null,
            'graded_by' => null,
        ];
    }

    public function graded(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => AssignmentSubmissionStatus::GRADED,
            'grade' => 85,
            'feedback' => fake()->sentence(),
            'graded_at' => now(),
        ]);
    }
}
