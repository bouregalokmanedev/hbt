<?php

use App\Enums\Courses\CourseStatus;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Instructor', 'web');
});

function courseAdmin(): User
{
    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    return $admin;
}

function courseInstructor(): User
{
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    return $instructor;
}

it('lists every course with moderation filters and enrollment totals', function () {
    $admin = courseAdmin();
    $instructor = courseInstructor();

    $review = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'title' => 'Needs review',
        'status' => CourseStatus::REVIEW,
    ]);
    Course::factory()->create([
        'instructor_id' => $instructor->id,
        'title' => 'Published course',
        'status' => CourseStatus::PUBLISHED,
    ]);

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/courses?status=review&search=Needs')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $review->id)
        ->assertJsonPath('data.0.instructor.id', $instructor->uuid)
        ->assertJsonPath('data.0.enrollments_count', 0);
});

it('rejects reviewed courses with a required moderation reason', function () {
    $admin = courseAdmin();
    $course = Course::factory()->create([
        'instructor_id' => courseInstructor()->id,
        'status' => CourseStatus::REVIEW,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/courses/{$course->id}/reject", ['reason' => 'Please add a published lesson.'])
        ->assertOk()
        ->assertJsonPath('data.status', CourseStatus::DRAFT->value);

    $this->assertDatabaseHas('courses', [
        'id' => $course->id,
        'status' => CourseStatus::DRAFT->value,
    ]);
});

it('archives and restores a published course', function () {
    $admin = courseAdmin();
    $course = Course::factory()->create([
        'instructor_id' => courseInstructor()->id,
        'status' => CourseStatus::PUBLISHED,
        'published_at' => now(),
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/courses/{$course->id}/archive")
        ->assertOk()
        ->assertJsonPath('data.status', CourseStatus::ARCHIVED->value);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/courses/{$course->id}/restore")
        ->assertOk()
        ->assertJsonPath('data.status', CourseStatus::DRAFT->value);
});

it('does not allow students to moderate platform courses', function () {
    $student = User::factory()->create();
    Role::findOrCreate('Student', 'web');
    $student->assignRole('Student');
    $course = Course::factory()->create(['instructor_id' => courseInstructor()->id]);

    $this->actingAs($student)
        ->getJson('/api/v1/admin/courses')
        ->assertForbidden();

    $this->actingAs($student)
        ->patchJson("/api/v1/admin/courses/{$course->id}/reject", ['reason' => 'No'])
        ->assertForbidden();
});
