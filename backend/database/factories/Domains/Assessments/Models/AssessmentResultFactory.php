<?php

namespace Database\Factories\Domains\Assessments\Models;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

final class AssessmentResultFactory extends Factory
{
    protected $model = AssessmentResult::class;

    public function definition(): array
    {
        $score = fake()->randomFloat(2, 0, 100);

        return [
            'assessment_id' => Assessment::factory(),

            'assessment_attempt_id' => AssessmentAttempt::factory(),

            'user_id' => User::factory(),

            'score' => $score,

            'passed' => $score >= 80,

            'attempt_number' => 1,

            'completed_at' => now(),

            'evidence' => [
                'lessons' => [
                    'required' => 0,
                    'completed' => 0,
                ],
                'quizzes' => [
                    'minimum_score' => 70,
                    'score' => 0,
                ],
                'scenarios' => [
                    'required' => 0,
                    'completed' => 0,
                ],
            ],

            'results' => [],
        ];
    }
}