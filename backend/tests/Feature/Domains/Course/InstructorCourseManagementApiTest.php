<?php

use App\Enums\Courses\CourseStatus;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
    Role::findOrCreate('Admin', 'web');
});

function managingInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

function instructorCoursePayload(array $overrides = []): array
{
    $slug = 'course-' . Str::lower(Str::random(12));

    return array_merge([
        'title' => 'Electrical Systems Fundamentals',
        'slug' => $slug,
        'short_description' => 'Build a reliable foundation in electrical diagnostics.',
        'description' => 'A complete introductory course for diagnostic technicians.',
        'language' => 'en',
        'difficulty' => 'beginner',
        'duration_minutes' => 120,
        'price' => 0,
        'discount_price' => null,
        'currency' => 'USD',
        'is_free' => true,
        'visibility' => 'public',
        'thumbnail' => 'https://example.test/thumbnail.jpg',
        'cover_image' => null,
        'preview_video' => null,
    ], $overrides);
}

describe('Instructor course management', function () {
    it('creates a draft that always belongs to the authenticated instructor', function () {
        $instructor = managingInstructor();
        $otherInstructor = managingInstructor();

        $response = $this
            ->actingAs($instructor)
            ->postJson(
                '/api/v1/instructor/courses',
                instructorCoursePayload([
                    'instructor_id' => $otherInstructor->id,
                ])
            );

        $response
            ->assertCreated()
            ->assertJsonPath('data.status', CourseStatus::DRAFT->value);

        $this->assertDatabaseHas('courses', [
            'title' => 'Electrical Systems Fundamentals',
            'instructor_id' => $instructor->id,
        ]);
    });

    it('rejects inconsistent course pricing before a course can be created', function () {
        $instructor = managingInstructor();

        $this
            ->actingAs($instructor)
            ->postJson('/api/v1/instructor/courses', instructorCoursePayload([
                'is_free' => true,
                'price' => 50,
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('price');

        $this
            ->actingAs($instructor)
            ->postJson('/api/v1/instructor/courses', instructorCoursePayload([
                'is_free' => false,
                'price' => 50,
                'discount_price' => 60,
            ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('discount_price');
    });

    it('forbids instructors from viewing or changing another instructors course', function () {
        $owner = managingInstructor();
        $otherInstructor = managingInstructor();

        $course = Course::factory()->create([
            'instructor_id' => $owner->id,
        ]);

        $this
            ->actingAs($otherInstructor)
            ->getJson("/api/v1/instructor/courses/{$course->id}")
            ->assertForbidden();

        $this
            ->actingAs($otherInstructor)
            ->patchJson(
                "/api/v1/instructor/courses/{$course->id}",
                instructorCoursePayload()
            )
            ->assertForbidden();

        $this
            ->actingAs($otherInstructor)
            ->postJson("/api/v1/instructor/courses/{$course->id}/unpublish")
            ->assertForbidden();
    });

    it('lets the owner submit, unpublish, archive, and restore a course', function () {
        $instructor = managingInstructor();

        $draft = Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::DRAFT,
        ]);

        $this
            ->actingAs($instructor)
            ->postJson("/api/v1/instructor/courses/{$draft->id}/submit-review")
            ->assertOk()
            ->assertJsonPath('data.status', CourseStatus::REVIEW->value);

        $published = Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::PUBLISHED,
            'published_at' => now(),
        ]);

        $this
            ->actingAs($instructor)
            ->postJson("/api/v1/instructor/courses/{$published->id}/unpublish")
            ->assertOk()
            ->assertJsonPath('data.status', CourseStatus::DRAFT->value);

        $archiveCandidate = Course::factory()->create([
            'instructor_id' => $instructor->id,
            'status' => CourseStatus::PUBLISHED,
            'published_at' => now(),
        ]);

        $this
            ->actingAs($instructor)
            ->postJson("/api/v1/instructor/courses/{$archiveCandidate->id}/archive")
            ->assertOk()
            ->assertJsonPath('data.status', CourseStatus::ARCHIVED->value);

        $this
            ->actingAs($instructor)
            ->postJson("/api/v1/instructor/courses/{$archiveCandidate->id}/restore")
            ->assertOk()
            ->assertJsonPath('data.status', CourseStatus::DRAFT->value);
    });
});
