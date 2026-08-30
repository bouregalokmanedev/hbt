<?php

use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function analyticsInstructor(): User
{
    $user = User::factory()->create();

    $user->assignRole('Instructor');

    return $user;
}

describe('Instructor course analytics', function () {

    it('requires authentication', function () {
        $course = Course::factory()->create();

        $response = $this->getJson(
            "/api/v1/instructor/courses/{$course->id}/analytics"
        );

        $response->assertUnauthorized();
    });

    it('returns analytics only for the course owner', function () {
        $instructor = analyticsInstructor();
        $otherInstructor = analyticsInstructor();

        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
        ]);

        $response = $this
            ->actingAs($otherInstructor)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/analytics"
            );

        $response->assertNotFound();
    });

    it('returns zero analytics for a course with no students', function () {
        $instructor = analyticsInstructor();

        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/analytics"
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.students.enrolled',
                0
            )
            ->assertJsonPath(
                'data.students.started',
                0
            )
            ->assertJsonPath(
                'data.students.in_progress',
                0
            )
            ->assertJsonPath(
                'data.students.completed',
                0
            )
            ->assertJsonPath(
                'data.students.average_progress',
                0
            )
            ->assertJsonPath(
                'data.students.completion_rate',
                0
            )
            ->assertJsonPath(
                'data.learning.total_time_seconds',
                0
            );
    });

    it('calculates student progress correctly', function () {
        $instructor = analyticsInstructor();

        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::PUBLISHED,
        ]);

        $studentOne = User::factory()->create();
        $studentTwo = User::factory()->create();

        Enrollment::factory()->create([
            'user_id' => $studentOne->id,
            'course_id' => $course->id,
            'status' => EnrollmentStatus::ACTIVE,
        ]);

        Enrollment::factory()->create([
            'user_id' => $studentTwo->id,
            'course_id' => $course->id,
            'status' => EnrollmentStatus::ACTIVE,
        ]);

        CourseProgress::factory()->create([
            'user_id' => $studentOne->id,
            'course_id' => $course->id,
            'progress_percentage' => 50,
            'time_spent' => 3600,
        ]);

        CourseProgress::factory()->create([
            'user_id' => $studentTwo->id,
            'course_id' => $course->id,
            'progress_percentage' => 100,
            'time_spent' => 1800,
            'completed_at' => now(),
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/analytics"
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.students.enrolled',
                2
            )
            ->assertJsonPath(
                'data.students.started',
                2
            )
            ->assertJsonPath(
                'data.students.in_progress',
                1
            )
            ->assertJsonPath(
                'data.students.completed',
                1
            )
            ->assertJsonPath(
                'data.students.average_progress',
                75
            )
            ->assertJsonPath(
                'data.students.completion_rate',
                50
            )
            ->assertJsonPath(
                'data.learning.total_time_seconds',
                5400
            )
            ->assertJsonPath(
                'data.learning.total_time_hours',
                1.5
            );
    });

    it('does not count cancelled enrollments', function () {
        $instructor = analyticsInstructor();

        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
        ]);

        $activeStudent = User::factory()->create();
        $cancelledStudent = User::factory()->create();

        Enrollment::factory()->create([
            'user_id' => $activeStudent->id,
            'course_id' => $course->id,
            'status' => EnrollmentStatus::ACTIVE,
        ]);

        Enrollment::factory()->create([
            'user_id' => $cancelledStudent->id,
            'course_id' => $course->id,
            'status' => EnrollmentStatus::CANCELLED,
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/analytics"
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.students.enrolled',
                1
            );
    });

    it('returns section, lesson, quiz, and engagement analytics', function () {
        $instructor = analyticsInstructor();
        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
        ]);
        $student = User::factory()->create();
        $inactiveStudent = User::factory()->create();
        $section = Section::factory()->create([
            'course_id' => $course->id,
            'title' => 'Electrical foundations',
        ]);
        $lesson = Lesson::factory()->create([
            'section_id' => $section->id,
            'title' => 'Voltage fundamentals',
        ]);
        $quiz = Quiz::factory()->create([
            'section_id' => $section->id,
            'title' => 'Voltage check',
        ]);

        Enrollment::factory()->create([
            'course_id' => $course->id,
            'user_id' => $student->id,
            'enrolled_at' => now(),
        ]);
        Enrollment::factory()->create([
            'course_id' => $course->id,
            'user_id' => $inactiveStudent->id,
            'enrolled_at' => now()->subDays(31),
        ]);
        CourseProgress::factory()->create([
            'course_id' => $course->id,
            'user_id' => $student->id,
            'progress_percentage' => 60,
            'updated_at' => now(),
        ]);
        CourseProgress::factory()->create([
            'course_id' => $course->id,
            'user_id' => $inactiveStudent->id,
            'progress_percentage' => 15,
            'updated_at' => now()->subDays(20),
        ]);
        LessonProgress::factory()->create([
            'lesson_id' => $lesson->id,
            'user_id' => $student->id,
            'progress_percentage' => 100,
            'completed_at' => now(),
        ]);
        QuizAttempt::factory()->submitted()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $student->id,
            'percentage' => 90,
            'passed' => true,
            'submitted_at' => now(),
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson("/api/v1/instructor/courses/{$course->id}/analytics");

        $response
            ->assertOk()
            ->assertJsonPath('data.enrollment.new_this_month', 1)
            ->assertJsonPath('data.sections.0.title', 'Electrical foundations')
            ->assertJsonPath('data.lesson_performance.0.title', 'Voltage fundamentals')
            ->assertJsonPath('data.lesson_performance.0.completed_students', 1)
            ->assertJsonPath('data.quizzes.0.title', 'Voltage check')
            ->assertJsonPath('data.quizzes.0.average_score', 90)
            ->assertJsonPath('data.quizzes.0.pass_rate', 100)
            ->assertJsonPath('data.engagement.active_last_7_days', 1)
            ->assertJsonPath('data.engagement.at_risk_students.0.student_id', $inactiveStudent->id);
    });

    it('does not allow a regular user to access analytics', function () {
        $user = User::factory()->create();

        $course = Course::factory()->create();

        $response = $this
            ->actingAs($user)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/analytics"
            );

        $response->assertForbidden();
    });
});
