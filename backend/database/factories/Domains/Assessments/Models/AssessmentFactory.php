<?php

namespace Database\Factories\Domains\Assessments\Models;

use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

final class AssessmentFactory extends Factory
{
    protected $model = Assessment::class;

    public function definition(): array
    {
        return [
            'course_id' => Course::factory(),

            'title' => fake()->sentence(4),

            'slug' => fake()->unique()->slug(),

            'description' => fake()->paragraph(),

            'minimum_score' => 80,

            'required_quiz_score' => 70,

            'required_scenarios' => 0,

            'max_attempts' => 3,

            'is_required' => true,

            'status' => AssessmentStatus::DRAFT,

            'published_at' => null,
        ];
    }
}