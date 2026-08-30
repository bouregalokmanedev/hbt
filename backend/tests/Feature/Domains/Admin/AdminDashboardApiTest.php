<?php

use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Super Admin', 'web');
    Role::findOrCreate('Instructor', 'web');
    Role::findOrCreate('Student', 'web');
});

it('requires authentication to view the admin dashboard', function () {
    $this->getJson('/api/v1/admin/dashboard')
        ->assertUnauthorized();
});

it('allows only verified administrators to view the admin dashboard', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/admin/dashboard')
        ->assertForbidden();

    $unverifiedAdmin = User::factory()->unverified()->create();
    $unverifiedAdmin->assignRole('Admin');

    $this->actingAs($unverifiedAdmin)
        ->getJson('/api/v1/admin/dashboard')
        ->assertForbidden();
});

it('returns the admin dashboard foundation for administrators', function () {
    $administrator = User::factory()->create([
        'first_name' => 'Ada',
        'last_name' => 'Admin',
        'email' => 'ada@example.test',
    ]);
    $administrator->assignRole('Admin');

    $this->actingAs($administrator)
        ->getJson('/api/v1/admin/dashboard')
        ->assertOk()
        ->assertJsonPath('data.administrator.uuid', $administrator->uuid)
        ->assertJsonPath('data.administrator.name', 'Ada Admin')
        ->assertJsonPath('data.administrator.email', 'ada@example.test')
        ->assertJsonPath('data.administrator.roles.0', 'Admin')
        ->assertJsonPath('data.meta.phase', 'statistics')
        ->assertJsonPath('data.meta.api_version', 'v1')
        ->assertJsonFragment(['dashboard'])
        ->assertJsonFragment(['system']);
});

it('reports platform-wide user, course, enrollment, and learning statistics', function () {
    Carbon::setTestNow('2026-08-29 12:00:00');

    $administrator = User::factory()->create(['status' => 'active']);
    $administrator->assignRole('Admin');

    $activeStudent = User::factory()->create(['status' => 'active']);
    $activeStudent->assignRole('Student');

    $inactiveStudent = User::factory()->create([
        'status' => 'suspended',
        'created_at' => now()->subMonth(),
    ]);
    $inactiveStudent->assignRole('Student');

    $instructor = User::factory()->create(['status' => 'active']);
    $instructor->assignRole('Instructor');

    $superAdmin = User::factory()->create(['status' => 'active']);
    $superAdmin->assignRole('Super Admin');

    $draft = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::DRAFT,
    ]);
    $review = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::REVIEW,
    ]);
    $published = Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::PUBLISHED,
    ]);
    Course::factory()->create([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::ARCHIVED,
    ]);

    Enrollment::factory()->create([
        'user_id' => $activeStudent->id,
        'course_id' => $draft->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);
    Enrollment::factory()->completed()->create([
        'user_id' => $activeStudent->id,
        'course_id' => $review->id,
    ]);
    Enrollment::factory()->cancelled()->create([
        'user_id' => $inactiveStudent->id,
        'course_id' => $published->id,
    ]);

    CourseProgress::factory()->create([
        'user_id' => $activeStudent->id,
        'course_id' => $draft->id,
        'progress_percentage' => 40,
        'updated_at' => now()->subDays(5),
    ]);
    CourseProgress::factory()->create([
        'user_id' => $inactiveStudent->id,
        'course_id' => $review->id,
        'progress_percentage' => 80,
        'completed_at' => now()->subDay(),
        'updated_at' => now()->subDay(),
    ]);

    $this->actingAs($administrator)
        ->getJson('/api/v1/admin/dashboard')
        ->assertOk()
        ->assertJsonPath('data.statistics.users.total', 5)
        ->assertJsonPath('data.statistics.users.students', 2)
        ->assertJsonPath('data.statistics.users.instructors', 1)
        ->assertJsonPath('data.statistics.users.administrators', 2)
        ->assertJsonPath('data.statistics.users.active', 4)
        ->assertJsonPath('data.statistics.users.new_this_month', 4)
        ->assertJsonPath('data.statistics.courses.total', 4)
        ->assertJsonPath('data.statistics.courses.draft', 1)
        ->assertJsonPath('data.statistics.courses.review', 1)
        ->assertJsonPath('data.statistics.courses.published', 1)
        ->assertJsonPath('data.statistics.courses.archived', 1)
        ->assertJsonPath('data.statistics.enrollments.total', 3)
        ->assertJsonPath('data.statistics.enrollments.active', 1)
        ->assertJsonPath('data.statistics.enrollments.completed', 1)
        ->assertJsonPath('data.statistics.enrollments.cancelled', 1)
        ->assertJsonPath('data.statistics.learning.average_progress', 60)
        ->assertJsonPath('data.statistics.learning.active_learners', 2)
        ->assertJsonPath('data.statistics.learning.completed_learners', 1);

    Carbon::setTestNow();
});

it('also allows super administrators to view the admin dashboard', function () {
    $administrator = User::factory()->create();
    $administrator->assignRole('Super Admin');

    $this->actingAs($administrator)
        ->getJson('/api/v1/admin/dashboard')
        ->assertOk()
        ->assertJsonPath('data.administrator.roles.0', 'Super Admin');
});
