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
    Role::findOrCreate('Instructor', 'web');
});

function studentsInstructor(): User
{
    $user = User::factory()->create();

    $user->assignRole('Instructor');

    return $user;
}

describe('Instructor course students', function () {

    it('requires authentication', function () {
        $course = Course::factory()->create();

        $response = $this->getJson(
            "/api/v1/instructor/courses/{$course->id}/students"
        );

        $response->assertUnauthorized();
    });

    it('only allows the course instructor to view students', function () {
        $instructor = studentsInstructor();
        $otherInstructor = studentsInstructor();

        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
        ]);

        $response = $this
            ->actingAs($otherInstructor)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/students"
            );

        $response->assertNotFound();
    });

    it('returns enrolled students', function () {
        $instructor = studentsInstructor();

        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
        ]);

        $student = User::factory()->create([
    'first_name' => 'John',
    'last_name' => 'Student',
]);

        Enrollment::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => EnrollmentStatus::ACTIVE,
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/students"
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.student.id',
                $student->id
            )
            ->assertJsonPath(
                'data.0.student.name',
                'John Student'
            )
            ->assertJsonPath(
                'data.0.enrollment.status',
                'active'
            );
    });

    it('returns course progress for students', function () {
        $instructor = studentsInstructor();

        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
        ]);

        $student = User::factory()->create();

        Enrollment::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => EnrollmentStatus::ACTIVE,
        ]);

        CourseProgress::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'progress_percentage' => 65,
            'time_spent' => 2400,
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/students"
            );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.0.progress.percentage',
                65
            )
            ->assertJsonPath(
                'data.0.progress.time_spent',
                2400
            );
    });

    it('does not return cancelled students', function () {
        $instructor = studentsInstructor();

        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
        ]);

        $student = User::factory()->create();

        Enrollment::factory()->create([
            'user_id' => $student->id,
            'course_id' => $course->id,
            'status' => EnrollmentStatus::CANCELLED,
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/students"
            );

        $response
            ->assertOk()
            ->assertJsonCount(0, 'data');
    });

    it('supports pagination', function () {
        $instructor = studentsInstructor();

        $course = Course::factory()->create([
            'instructor_id' => $instructor->id,
        ]);

        $students = User::factory()->count(3)->create();

        foreach ($students as $student) {
            Enrollment::factory()->create([
                'user_id' => $student->id,
                'course_id' => $course->id,
                'status' => EnrollmentStatus::ACTIVE,
            ]);
        }

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/students?per_page=2"
            );

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath(
                'meta.per_page',
                2
            )
            ->assertJsonPath(
                'meta.total',
                3
            );
    });

    it('does not allow regular users to access students', function () {
        $user = User::factory()->create();

        $course = Course::factory()->create();

        $response = $this
            ->actingAs($user)
            ->getJson(
                "/api/v1/instructor/courses/{$course->id}/students"
            );

        $response->assertForbidden();
    });
});