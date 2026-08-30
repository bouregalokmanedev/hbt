<?php

use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    foreach (['Admin', 'Instructor', 'Student'] as $role) {
        Role::findOrCreate($role, 'web');
    }
});

function enrollmentAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    return $admin;
}

it('lists platform enrollments with student, course, status, and progress', function () {
    $admin = enrollmentAdmin();
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $student = User::factory()->create(['first_name' => 'Nora']);
    $student->assignRole('Student');
    $course = Course::factory()->create(['instructor_id' => $instructor->id, 'title' => 'Engine Systems']);
    $enrollment = Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);
    CourseProgress::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'progress_percentage' => 45,
    ]);

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/enrollments?student={$student->uuid}&course={$course->id}&status=active&search=Nora")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $enrollment->id)
        ->assertJsonPath('data.0.student.id', $student->uuid)
        ->assertJsonPath('data.0.course.id', $course->id)
        ->assertJsonPath('data.0.progress_percentage', 45);
});

it('shows an individual enrollment and returns zero progress when learning has not started', function () {
    $admin = enrollmentAdmin();
    $student = User::factory()->create();
    $student->assignRole('Student');
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);
    $enrollment = Enrollment::factory()->completed()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
    ]);

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/enrollments/{$enrollment->id}")
        ->assertOk()
        ->assertJsonPath('data.status', EnrollmentStatus::COMPLETED->value)
        ->assertJsonPath('data.progress_percentage', 0);
});

it('does not expose platform enrollments to students', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/admin/enrollments')
        ->assertForbidden();
});
