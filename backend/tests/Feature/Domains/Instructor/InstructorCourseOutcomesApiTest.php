<?php

use App\Models\Certificate;
use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Models\Course;
use App\Models\CourseFeedback;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function outcomesInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

describe('Instructor course feedback and certificates', function () {
    it('returns feedback analytics only to the course owner', function () {
        $owner = outcomesInstructor();
        $other = outcomesInstructor();
        $student = User::factory()->create(['first_name' => 'Nora', 'last_name' => 'Lee']);
        $course = Course::factory()->create(['instructor_id' => $owner->id]);
        $lesson = Lesson::factory()->create([
            'section_id' => Section::factory()->create(['course_id' => $course->id])->id,
            'title' => 'Voltage drop',
        ]);

        CourseFeedback::query()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'lesson_id' => $lesson->id,
            'rating' => 5,
            'comment' => 'Very clear explanation.',
        ]);

        $this
            ->actingAs($owner)
            ->getJson("/api/v1/instructor/courses/{$course->id}/feedback")
            ->assertOk()
            ->assertJsonPath('data.summary.total', 1)
            ->assertJsonPath('data.summary.average_rating', 5)
            ->assertJsonPath('data.summary.rating_distribution.5', 1)
            ->assertJsonPath('data.recent_feedback.0.student_name', 'Nora Lee')
            ->assertJsonPath('data.recent_feedback.0.lesson_title', 'Voltage drop');

        $this
            ->actingAs($other)
            ->getJson("/api/v1/instructor/courses/{$course->id}/feedback")
            ->assertNotFound();
    });

    it('shows certificate issuance statistics without mutation actions', function () {
        $owner = outcomesInstructor();
        $student = User::factory()->create(['first_name' => 'Rami', 'last_name' => 'Stone']);
        $course = Course::factory()->create(['instructor_id' => $owner->id, 'title' => 'CAN Systems']);

        $enrollment = Enrollment::factory()->create([
            'course_id' => $course->id,
            'user_id' => $student->id,
        ]);
        CourseProgress::factory()->create(['course_id' => $course->id, 'user_id' => $student->id, 'completed_at' => now(), 'progress_percentage' => 100]);
        $assessment = Assessment::factory()->create(['course_id' => $course->id]);
        $attempt = AssessmentAttempt::factory()->create([
            'assessment_id' => $assessment->id,
            'user_id' => $student->id,
            'status' => AssessmentAttemptStatus::PASSED,
            'passed' => true,
        ]);
        $result = AssessmentResult::factory()->create([
            'assessment_id' => $assessment->id,
            'assessment_attempt_id' => $attempt->id,
            'user_id' => $student->id,
            'passed' => true,
        ]);
        Certificate::query()->create([
            'enrollment_id' => $enrollment->id,
            'assessment_result_id' => $result->id,
            'course_id' => $course->id,
            'user_id' => $student->id,
            'recipient_name' => $student->full_name,
            'course_title' => $course->title,
            'certificate_number' => 'HBT-COURSEOUTCOME',
            'issued_at' => now(),
        ]);

        $this
            ->actingAs($owner)
            ->getJson("/api/v1/instructor/courses/{$course->id}/certificates")
            ->assertOk()
            ->assertJsonPath('data.summary.issued', 1)
            ->assertJsonPath('data.summary.completed_students', 1)
            ->assertJsonPath('data.summary.issuance_rate', 100)
            ->assertJsonPath('data.certificates.0.student_name', 'Rami Stone')
            ->assertJsonPath('data.certificates.0.certificate_number', 'HBT-COURSEOUTCOME');
    });
});
