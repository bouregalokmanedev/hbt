<?php

namespace Database\Factories\Domains\Assessments\Models;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

final class AssessmentAttemptFactory extends Factory
{
    protected $model = AssessmentAttempt::class;

    public function definition(): array
    {
        return [
            'assessment_id' => Assessment::factory(),

            'user_id' => User::factory(),

            'attempt_number' => 1,

            'status' => AssessmentAttemptStatus::IN_PROGRESS,

            'score' => null,

            'passed' => null,

            'started_at' => now(),

            'submitted_at' => null,

            'completed_at' => null,
        ];
    }
}