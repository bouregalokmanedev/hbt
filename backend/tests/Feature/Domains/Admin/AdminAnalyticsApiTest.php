<?php

use App\Domains\Assignments\Enums\AssignmentSubmissionStatus;
use App\Domains\Assignments\Models\Assignment;
use App\Domains\Assignments\Models\AssignmentSubmission;
use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Instructor', 'Student'] as $role) {
        Role::findOrCreate($role, 'web');
    }

    Carbon::setTestNow('2026-08-29 12:00:00');
});

afterEach(function () {
    Carbon::setTestNow();
});

function analyticsAdmin(): User
{
    $admin = User::factory()->create(['created_at' => '2026-08-01 09:00:00']);
    $admin->assignRole('Admin');

    return $admin;
}

it('returns continuous user, course, and enrollment series with period comparisons', function () {
    $admin = analyticsAdmin();
    $currentStudent = User::factory()->create(['created_at' => '2026-08-28 10:00:00']);
    $currentStudent->assignRole('Student');
    $previousStudent = User::factory()->create(['created_at' => '2026-08-25 10:00:00']);
    $previousStudent->assignRole('Student');

    $instructor = User::factory()->create(['created_at' => '2026-08-10 10:00:00']);
    $instructor->assignRole('Instructor');

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::PUBLISHED,
        'created_at' => '2026-08-28 10:00:00',
        'published_at' => '2026-08-28 11:00:00',
    ]);

    Enrollment::factory()->completed()->create([
        'user_id' => $currentStudent->id,
        'course_id' => $course->id,
        'enrolled_at' => '2026-08-28 12:00:00',
        'completed_at' => '2026-08-29 09:00:00',
    ]);

    $period = 'date_from=2026-08-27&date_to=2026-08-29';

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/analytics/users?{$period}")
        ->assertOk()
        ->assertJsonPath('data.summary.students', 2)
        ->assertJsonPath('data.summary.instructors', 1)
        ->assertJsonPath('data.summary.new_in_period', 1)
        ->assertJsonPath('data.previous_period.from', '2026-08-24')
        ->assertJsonPath('data.previous_period.to', '2026-08-26')
        ->assertJsonPath('data.comparison.new_in_period.current', 1)
        ->assertJsonPath('data.comparison.new_in_period.previous', 1)
        ->assertJsonPath('data.comparison.new_in_period.change', 0)
        ->assertJsonCount(3, 'data.series')
        ->assertJsonPath('data.series.0.date', '2026-08-27')
        ->assertJsonPath('data.series.0.new_users', 0)
        ->assertJsonPath('data.series.1.date', '2026-08-28')
        ->assertJsonPath('data.series.1.new_users', 1);

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/analytics/courses?{$period}")
        ->assertOk()
        ->assertJsonPath('data.summary.published', 1)
        ->assertJsonPath('data.summary.published_in_period', 1)
        ->assertJsonPath('data.comparison.published_in_period.current', 1)
        ->assertJsonPath('data.comparison.published_in_period.previous', 0)
        ->assertJsonCount(3, 'data.created_series')
        ->assertJsonPath('data.created_series.0.courses', 0)
        ->assertJsonPath('data.created_series.1.courses', 1);

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/analytics/enrollments?{$period}")
        ->assertOk()
        ->assertJsonPath('data.summary.completed', 1)
        ->assertJsonPath('data.summary.completion_rate', 100)
        ->assertJsonPath('data.summary.new_in_period', 1)
        ->assertJsonCount(3, 'data.enrollment_series')
        ->assertJsonPath('data.enrollment_series.0.enrollments', 0)
        ->assertJsonPath('data.enrollment_series.1.enrollments', 1)
        ->assertJsonPath('data.completion_series.2.completions', 1);
});

it('returns learning performance, engagement, and completion rates', function () {
    $admin = analyticsAdmin();
    $student = User::factory()->create();
    $student->assignRole('Student');
    $instructor = User::factory()->create(['created_at' => '2026-08-10 09:00:00']);
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id, 'title' => 'Electrical Systems']);

    CourseProgress::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'progress_percentage' => 80,
        'time_spent' => 3600,
        'completed_at' => '2026-08-29 10:00:00',
        'updated_at' => '2026-08-29 10:00:00',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/analytics/learning?date_from=2026-08-01&date_to=2026-08-29')
        ->assertOk()
        ->assertJsonPath('data.summary.average_progress', 80)
        ->assertJsonPath('data.summary.completion_rate', 100)
        ->assertJsonPath('data.summary.active_learners', 1)
        ->assertJsonPath('data.summary.completed_learners', 1)
        ->assertJsonPath('data.summary.time_spent_seconds', 3600)
        ->assertJsonPath('data.summary.completions_in_period', 1)
        ->assertJsonPath('data.comparison.active_learners.current', 1)
        ->assertJsonPath('data.by_course.0.course_id', $course->id)
        ->assertJsonPath('data.by_course.0.average_progress', 80)
        ->assertJsonPath('data.by_course.0.completion_rate', 100)
        ->assertJsonPath('data.by_course.0.time_spent_seconds', 3600)
        ->assertJsonCount(29, 'data.engagement_series')
        ->assertJsonPath('data.engagement_series.28.active_learners', 1);
});

it('returns assignment operations analytics and grading backlog', function () {
    $admin = analyticsAdmin();
    $student = User::factory()->create();
    $student->assignRole('Student');
    $otherStudent = User::factory()->create();
    $otherStudent->assignRole('Student');
    $instructor = User::factory()->create(['created_at' => '2026-08-10 09:00:00']);
    $instructor->assignRole('Instructor');

    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'title' => 'Charging Systems',
    ]);

    $assignment = Assignment::factory()->published()->create([
        'course_id' => $course->id,
        'title' => 'Bench test a charging system',
        'max_points' => 50,
        'due_at' => '2026-08-28 17:00:00',
        'published_at' => '2026-08-20 09:00:00',
    ]);

    AssignmentSubmission::factory()->create([
        'assignment_id' => $assignment->id,
        'user_id' => $student->id,
        'status' => AssignmentSubmissionStatus::SUBMITTED,
        'submitted_at' => '2026-08-28 10:00:00',
    ]);

    AssignmentSubmission::factory()->create([
        'assignment_id' => $assignment->id,
        'user_id' => $otherStudent->id,
        'status' => AssignmentSubmissionStatus::GRADED,
        'grade' => 40,
        'feedback' => 'Good work',
        'submitted_at' => '2026-08-27 10:00:00',
        'graded_at' => '2026-08-28 11:00:00',
        'graded_by' => $instructor->id,
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/analytics/assignments?date_from=2026-08-27&date_to=2026-08-29')
        ->assertOk()
        ->assertJsonPath('data.summary.total', 1)
        ->assertJsonPath('data.summary.published', 1)
        ->assertJsonPath('data.summary.draft', 0)
        ->assertJsonPath('data.summary.submissions', 2)
        ->assertJsonPath('data.summary.pending_grading', 1)
        ->assertJsonPath('data.summary.graded', 1)
        ->assertJsonPath('data.summary.overdue', 1)
        ->assertJsonPath('data.summary.average_grade', 80)
        ->assertJsonPath('data.summary.submissions_in_period', 2)
        ->assertJsonPath('data.summary.graded_in_period', 1)
        ->assertJsonPath('data.assignment_by_course.0.course_id', $course->id)
        ->assertJsonPath('data.assignment_by_course.0.assignments_count', 1)
        ->assertJsonPath('data.assignment_by_course.0.pending_grading', 1)
        ->assertJsonPath('data.assignment_by_course.0.average_grade', 80)
        ->assertJsonCount(3, 'data.submission_series')
        ->assertJsonPath('data.submission_series.0.submissions', 1)
        ->assertJsonPath('data.submission_series.1.submissions', 1)
        ->assertJsonPath('data.grading_series.1.graded', 1);
});

it('returns a cross-domain overview with operational queues', function () {
    $admin = analyticsAdmin();
    $student = User::factory()->create(['created_at' => '2026-08-28 09:00:00']);
    $student->assignRole('Student');
    $instructor = User::factory()->create(['created_at' => '2026-08-10 09:00:00']);
    $instructor->assignRole('Instructor');

    $reviewCourse = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::REVIEW,
    ]);
    $publishedCourse = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::PUBLISHED,
        'published_at' => '2026-08-28 12:00:00',
    ]);

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $publishedCourse->id,
        'status' => EnrollmentStatus::ACTIVE,
        'enrolled_at' => '2026-08-28 13:00:00',
    ]);

    CourseProgress::factory()->create([
        'user_id' => $student->id,
        'course_id' => $publishedCourse->id,
        'progress_percentage' => 45,
        'updated_at' => '2026-08-28 14:00:00',
    ]);

    $overdue = Assignment::factory()->published()->create([
        'course_id' => $publishedCourse->id,
        'due_at' => '2026-08-28 17:00:00',
    ]);

    AssignmentSubmission::factory()->create([
        'assignment_id' => $overdue->id,
        'user_id' => $student->id,
        'status' => AssignmentSubmissionStatus::SUBMITTED,
        'submitted_at' => '2026-08-28 15:00:00',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/analytics/overview?date_from=2026-08-27&date_to=2026-08-29')
        ->assertOk()
        ->assertJsonPath('data.summary.students', 1)
        ->assertJsonPath('data.summary.published_courses', 1)
        ->assertJsonPath('data.summary.enrollments', 1)
        ->assertJsonPath('data.summary.active_learners', 1)
        ->assertJsonPath('data.summary.assignments_published', 1)
        ->assertJsonPath('data.operations.courses_in_review', 1)
        ->assertJsonPath('data.operations.assignments_pending_grading', 1)
        ->assertJsonPath('data.operations.assignments_overdue', 1)
        ->assertJsonPath('data.comparison.new_enrollments.current', 1)
        ->assertJsonPath('data.comparison.submissions_in_period.current', 1)
        ->assertJsonPath('data.top_courses.0.course_id', $publishedCourse->id)
        ->assertJsonCount(3, 'data.growth_series')
        ->assertJsonPath('data.growth_series.1.new_enrollments', 1)
        ->assertJsonPath('data.growth_series.1.new_users', 1)
        ->assertJsonPath('data.growth_series.0.date', '2026-08-27');
});

it('rejects analytics ranges longer than a year', function () {
    $admin = analyticsAdmin();

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/analytics/users?date_from=2024-01-01&date_to=2026-08-29')
        ->assertUnprocessable();
});

it('allows only administrators to use analytics endpoints', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/admin/analytics/overview')
        ->assertForbidden();
});
