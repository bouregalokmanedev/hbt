<?php

namespace Database\Factories\Domains\StudentAssessments\Models;

use App\Domains\StudentAssessments\Models\StudentAssessmentIntegrityEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

final class StudentAssessmentIntegrityEventFactory extends Factory
{
    protected $model = StudentAssessmentIntegrityEvent::class;

    public function definition(): array
    {
        return [
            'attempt_id' => \App\Domains\Assessments\Models\AssessmentAttempt::factory(),
            'event_type' => fake()->randomElement(['ATTEMPT_STARTED', 'QUESTION_OPENED', 'TAB_BLUR', 'TAB_FOCUS', 'SUBMISSION_STARTED']),
            'occurred_at' => now(),
            'metadata' => [],
        ];
    }
}