<?php

use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Enums\Courses\CourseStatus;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function readinessInstructor(): User
{
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    return $instructor;
}

function readinessCourse(User $instructor, array $overrides = []): Course
{
    $course = Course::factory()->create(array_merge([
        'instructor_id' => $instructor->id,
        'status' => CourseStatus::REVIEW,
        'title' => 'Electrical diagnostics',
        'description' => 'A practical course covering electrical diagnostics.',
        'duration_minutes' => 120,
        'thumbnail' => 'media/course.jpg',
    ], $overrides));

    $section = Section::factory()->create([
        'course_id' => $course->id,
        'status' => SectionStatus::PUBLISHED,
        'position' => 1,
    ]);

    Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
        'position' => 1,
    ]);

    return $course;
}

it('reports a course as ready when every required publish check passes', function () {
    $instructor = readinessInstructor();
    $course = readinessCourse($instructor);

    Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => AssessmentStatus::PUBLISHED,
    ]);

    $response = $this->actingAs($instructor)->getJson("/api/v1/instructor/courses/{$course->id}/readiness");

    $response->assertOk()
        ->assertJsonPath('data.ready', true)
        ->assertJsonPath('data.score', 88)
        ->assertJsonPath('data.checks.0.key', 'title')
        ->assertJsonPath('data.checks.6.key', 'assessment')
        ->assertJsonPath('data.checks.6.passed', true)
        ->assertJsonPath('data.checks.7.key', 'practical_scenario')
        ->assertJsonPath('data.checks.7.required', false);
});

it('flags missing required authoring details', function () {
    $instructor = readinessInstructor();
    $course = readinessCourse($instructor, ['thumbnail' => null]);

    Course::query()->whereKey($course->id)->update(['duration_minutes' => 0]);

    $response = $this->actingAs($instructor)->getJson("/api/v1/instructor/courses/{$course->id}/readiness");

    $response->assertOk()
        ->assertJsonPath('data.ready', false)
        ->assertJsonPath('data.checks.2.key', 'thumbnail')
        ->assertJsonPath('data.checks.2.passed', false)
        ->assertJsonPath('data.checks.3.passed', false);
});

it('forbids instructors from checking another instructor course', function () {
    $owner = readinessInstructor();
    $other = readinessInstructor();
    $course = readinessCourse($owner);

    $this->actingAs($other)
        ->getJson("/api/v1/instructor/courses/{$course->id}/readiness")
        ->assertForbidden();
});
