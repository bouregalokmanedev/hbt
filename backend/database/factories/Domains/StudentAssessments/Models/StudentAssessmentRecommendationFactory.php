<?php

namespace Database\Factories\Domains\StudentAssessments\Models;

use App\Domains\StudentAssessments\Models\StudentAssessmentRecommendation;
use Illuminate\Database\Eloquent\Factories\Factory;

final class StudentAssessmentRecommendationFactory extends Factory
{
    protected $model = StudentAssessmentRecommendation::class;

    public function definition(): array
    {
        return [
            'student_id' => \App\Models\User::factory(),
            'attempt_id' => \App\Domains\Assessments\Models\AssessmentAttempt::factory(),
            'assessment_result_id' => \App\Domains\StudentAssessments\Models\StudentAssessmentResult::factory(),
            'competency_id' => \App\Domains\Assessments\Models\Competency::factory(),
            'competency_name' => fake()->words(2, true),
            'course_id' => \App\Models\Course::factory(),
            'section_id' => \App\Models\Section::factory(),
            'lesson_id' => \App\Models\Lesson::factory(),
            'recommendation_type' => 'lesson_review',
            'title' => 'Review: '.fake()->words(3, true),
            'description' => fake()->sentence(),
            'priority' => fake()->randomElement(['low', 'medium', 'high']),
            'reason' => 'Scored below proficiency threshold.',
            'status' => 'pending',
        ];
    }
}