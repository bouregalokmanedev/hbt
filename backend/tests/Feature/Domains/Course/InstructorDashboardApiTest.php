<?php

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {

    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Super Admin', 'web');
    Role::findOrCreate('Instructor', 'web');
});



function instructorUser(): User
{
    $user = User::factory()->create();

    $user->assignRole('Instructor');

    return $user;
}

describe('Instructor course listing', function () {
    it('requires authentication', function () {
        $response = $this->getJson(
            '/api/v1/instructor/courses'
        );

        $response->assertUnauthorized();
    });

    it('returns only the authenticated instructor courses', function () {
        $instructor = instructorUser();
        $otherInstructor = instructorUser();

        $ownCourse = Course::factory()->create([
            'instructor_id' => $instructor->id,
            'title' => 'My Course',
        ]);

        Course::factory()->create([
            'instructor_id' => $otherInstructor->id,
            'title' => 'Other Instructor Course',
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson('/api/v1/instructor/courses');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $ownCourse->id
            )
            ->assertJsonMissing([
                'title' => 'Other Instructor Course',
            ]);
    });

    it('cannot override instructor ownership through a request parameter', function () {
        $instructor = instructorUser();
        $otherInstructor = instructorUser();

        Course::factory()->create([
            'instructor_id' => $otherInstructor->id,
            'title' => 'Secret Course',
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                '/api/v1/instructor/courses?' .
                http_build_query([
                    'instructor_id' => $otherInstructor->id,
                ])
            );

        $response
            ->assertOk()
            ->assertJsonMissing([
                'title' => 'Secret Course',
            ]);
    });

    it('supports search', function () {
        $instructor = instructorUser();

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'title' => 'Laravel Architecture',
        ]);

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'title' => 'Python Fundamentals',
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                '/api/v1/instructor/courses?search=Laravel'
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.title',
                'Laravel Architecture'
            );
    });

    it('supports status filtering', function () {
        $instructor = instructorUser();

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::DRAFT,
            'title' => 'Draft Course',
        ]);

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::PUBLISHED,
            'title' => 'Published Course',
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                '/api/v1/instructor/courses?status=' .
                CourseStatus::PUBLISHED->value
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.title',
                'Published Course'
            );
    });

    it('supports difficulty filtering', function () {
        $instructor = instructorUser();

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'difficulty' => Difficulty::BEGINNER,
            'title' => 'Beginner Course',
        ]);

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'difficulty' => Difficulty::ADVANCED,
            'title' => 'Advanced Course',
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                '/api/v1/instructor/courses?difficulty=' .
                Difficulty::BEGINNER->value
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.title',
                'Beginner Course'
            );
    });

    it('supports free course filtering', function () {
        $instructor = instructorUser();

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'is_free' => true,
            'title' => 'Free Course',
        ]);

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'is_free' => false,
            'title' => 'Paid Course',
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                '/api/v1/instructor/courses?free=1'
            );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.title',
                'Free Course'
            );
    });

    it('does not leak courses from another instructor when searching', function () {
        $instructor = instructorUser();
        $otherInstructor = instructorUser();

        Course::factory()->create([
            'instructor_id' => $otherInstructor->id,
            'title' => 'Laravel Secret Course',
        ]);

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'title' => 'My Public Course',
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson(
                '/api/v1/instructor/courses?search=Laravel'
            );

        $response
            ->assertOk()
            ->assertJsonCount(0, 'data');
    });
});

describe('Instructor dashboard', function () {
    it('requires authentication', function () {
        $response = $this->getJson(
            '/api/v1/instructor/dashboard'
        );

        $response->assertUnauthorized();
    });

    it('returns statistics for the authenticated instructor only', function () {
        $instructor = instructorUser();
        $otherInstructor = instructorUser();

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::DRAFT,
        ]);

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::DRAFT,
        ]);

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::REVIEW,
        ]);

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::PUBLISHED,
        ]);

        Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::ARCHIVED,
        ]);

        Course::factory()->create([
            'instructor_id' => $otherInstructor->id,
            'status' => CourseStatus::PUBLISHED,
        ]);

        $response = $this
            ->actingAs($instructor)
            ->getJson('/api/v1/instructor/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.statistics.total',
                5
            )
            ->assertJsonPath(
                'data.statistics.draft',
                2
            )
            ->assertJsonPath(
                'data.statistics.review',
                1
            )
            ->assertJsonPath(
                'data.statistics.published',
                1
            )
            ->assertJsonPath(
                'data.statistics.archived',
                1
            );
    });

    it('returns zero statistics when the instructor has no courses', function () {
        $instructor = instructorUser();

        $response = $this
            ->actingAs($instructor)
            ->getJson('/api/v1/instructor/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.statistics.total',
                0
            )
            ->assertJsonPath(
                'data.statistics.draft',
                0
            )
            ->assertJsonPath(
                'data.statistics.review',
                0
            )
            ->assertJsonPath(
                'data.statistics.published',
                0
            )
            ->assertJsonPath(
                'data.statistics.archived',
                0
            );
    });
});

describe('Instructor role authorization', function () {
    it('does not grant instructor dashboard access to a regular user', function () {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->getJson('/api/v1/instructor/dashboard');

        $response->assertForbidden();
    });

    it('does not grant instructor course access to a regular user', function () {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->getJson('/api/v1/instructor/courses');

        $response->assertForbidden();
    });
});
