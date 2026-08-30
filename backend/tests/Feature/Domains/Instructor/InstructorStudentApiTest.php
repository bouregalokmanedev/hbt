<?php

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function studentManager(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

describe('Instructor student directory', function () {
    it('lists each student only when enrolled in the instructors courses', function () {
        $instructor = studentManager();
        $otherInstructor = studentManager();
        $student = User::factory()->create(['first_name' => 'Maya', 'last_name' => 'Diaz']);
        $otherStudent = User::factory()->create(['first_name' => 'Private', 'last_name' => 'Student']);
        $course = Course::factory()->create(['instructor_id' => $instructor->id]);
        $otherCourse = Course::factory()->create(['instructor_id' => $otherInstructor->id]);

        Enrollment::factory()->create(['course_id' => $course->id, 'user_id' => $student->id]);
        Enrollment::factory()->create(['course_id' => $otherCourse->id, 'user_id' => $otherStudent->id]);
        CourseProgress::factory()->create(['course_id' => $course->id, 'user_id' => $student->id, 'progress_percentage' => 65]);

        $this
            ->actingAs($instructor)
            ->getJson('/api/v1/instructor/students?search=Maya')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.student.name', 'Maya Diaz')
            ->assertJsonPath('data.0.average_progress', 65)
            ->assertJsonMissing(['name' => 'Private Student']);
    });

    it('does not expose a learner with no enrollment in an owned course', function () {
        $instructor = studentManager();
        $otherInstructor = studentManager();
        $student = User::factory()->create();
        $otherCourse = Course::factory()->create(['instructor_id' => $otherInstructor->id]);
        Enrollment::factory()->create(['course_id' => $otherCourse->id, 'user_id' => $student->id]);

        $this
            ->actingAs($instructor)
            ->getJson("/api/v1/instructor/students/{$student->id}")
            ->assertNotFound();
    });

    it('returns owned-course progress, quizzes, and assessments for a student', function () {
        $instructor = studentManager();
        $student = User::factory()->create();
        $course = Course::factory()->create(['instructor_id' => $instructor->id, 'title' => 'CAN Diagnostics']);
        $enrollment = Enrollment::factory()->create(['course_id' => $course->id, 'user_id' => $student->id]);
        CourseProgress::factory()->create(['course_id' => $course->id, 'user_id' => $student->id, 'progress_percentage' => 70]);
        $quiz = Quiz::factory()->create(['section_id' => Section::factory()->create(['course_id' => $course->id])->id, 'title' => 'CAN quiz']);
        QuizAttempt::factory()->submitted()->create(['quiz_id' => $quiz->id, 'user_id' => $student->id, 'percentage' => 88, 'passed' => true, 'submitted_at' => now()]);
        $assessment = Assessment::factory()->create(['course_id' => $course->id, 'title' => 'Final diagnostic']);
        $assessmentAttempt = AssessmentAttempt::factory()->create(['assessment_id' => $assessment->id, 'user_id' => $student->id, 'status' => AssessmentAttemptStatus::PASSED, 'score' => 91, 'passed' => true, 'submitted_at' => now()]);
        $assessmentResult = AssessmentResult::factory()->create([
            'assessment_id' => $assessment->id,
            'assessment_attempt_id' => $assessmentAttempt->id,
            'user_id' => $student->id,
            'passed' => true,
        ]);
        Certificate::factory()->create([
            'enrollment_id' => $enrollment->id,
            'assessment_result_id' => $assessmentResult->id,
            'course_id' => $course->id,
            'user_id' => $student->id,
            'course_title' => $course->title,
            'certificate_number' => 'HBT-STUDENTHISTORY',
        ]);

        $this
            ->actingAs($instructor)
            ->getJson("/api/v1/instructor/students/{$student->id}")
            ->assertOk()
            ->assertJsonPath('data.courses.0.course.title', 'CAN Diagnostics')
            ->assertJsonPath('data.courses.0.progress.percentage', 70)
            ->assertJsonPath('data.quiz_attempts.0.score', 88)
            ->assertJsonPath('data.assessment_attempts.0.score', 91)
            ->assertJsonPath('data.certificates.0.course_title', 'CAN Diagnostics')
            ->assertJsonPath('data.certificates.0.certificate_number', 'HBT-STUDENTHISTORY');
    });
});
