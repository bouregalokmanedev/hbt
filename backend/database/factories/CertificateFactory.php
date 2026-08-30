<?php

namespace Database\Factories;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Certificate>
 */
final class CertificateFactory extends Factory
{
    protected $model = Certificate::class;

    public function definition(): array
    {
        $user = User::factory();
        $course = Course::factory();

        $enrollment = Enrollment::factory()->state([
            'user_id' => $user,
            'course_id' => $course,
        ]);

        $assessment = Assessment::factory()->state([
            'course_id' => $course,
        ]);

        $attempt = AssessmentAttempt::factory()->state([
            'assessment_id' => $assessment,
            'user_id' => $user,
            'passed' => true,
        ]);

        $result = AssessmentResult::factory()->state([
            'assessment_id' => $assessment,
            'assessment_attempt_id' => $attempt,
            'user_id' => $user,
            'passed' => true,
        ]);

        return [
            'enrollment_id' => $enrollment,
            'assessment_result_id' => $result,
            'course_id' => $course,
            'user_id' => $user,
            'certificate_number' => 'HBT-' . fake()->unique()->regexify('[A-Z0-9]{14}'),
            'recipient_name' => fake()->name(),
            'course_title' => fake()->sentence(4),
            'issued_at' => now(),
        ];
    }
}