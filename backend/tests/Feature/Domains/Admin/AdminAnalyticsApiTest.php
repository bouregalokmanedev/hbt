<?php

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
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    return $admin;
}

it('returns user, course, and enrollment chart data for the requested period', function () {
    $admin = analyticsAdmin();
    $student = User::factory()->create(['created_at' => now()->subDay()]);
    $student->assignRole('Student');
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::PUBLISHED,
        'created_at' => now()->subDay(),
        'published_at' => now()->subDay(),
    ]);
    Enrollment::factory()->completed()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'enrolled_at' => now()->subDay(),
        'completed_at' => now(),
    ]);

    $period = 'date_from=2026-08-27&date_to=2026-08-29';

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/analytics/users?{$period}")
        ->assertOk()
        ->assertJsonPath('data.summary.students', 1)
        ->assertJsonPath('data.summary.instructors', 1)
        ->assertJsonPath('data.summary.new_in_period', 3)
        ->assertJsonPath('data.series.0.date', '2026-08-28');

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/analytics/courses?{$period}")
        ->assertOk()
        ->assertJsonPath('data.summary.published', 1)
        ->assertJsonPath('data.summary.published_in_period', 1)
        ->assertJsonPath('data.created_series.0.courses', 1);

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/analytics/enrollments?{$period}")
        ->assertOk()
        ->assertJsonPath('data.summary.completed', 1)
        ->assertJsonPath('data.enrollment_series.0.enrollments', 1)
        ->assertJsonPath('data.completion_series.0.completions', 1);
});

it('returns learning performance and uses the existing course progress records', function () {
    $admin = analyticsAdmin();
    $student = User::factory()->create();
    $student->assignRole('Student');
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id, 'title' => 'Electrical Systems']);

    CourseProgress::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'progress_percentage' => 80,
        'time_spent' => 3600,
        'completed_at' => now(),
        'updated_at' => now(),
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/analytics/learning?date_from=2026-08-01&date_to=2026-08-29')
        ->assertOk()
        ->assertJsonPath('data.summary.average_progress', 80)
        ->assertJsonPath('data.summary.completion_rate', 100)
        ->assertJsonPath('data.summary.active_learners', 1)
        ->assertJsonPath('data.summary.time_spent_seconds', 3600)
        ->assertJsonPath('data.by_course.0.course_id', $course->id)
        ->assertJsonPath('data.by_course.0.average_progress', 80);
});

it('allows only administrators to use analytics endpoints', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/admin/analytics/overview')
        ->assertForbidden();
});
