<?php

use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
    Role::findOrCreate('Student', 'web');
});

function trendOwnedCourse(User $instructor): Course
{
    return Course::factory()->create([
        'status' => 'published',
        'instructor_id' => $instructor->id,
    ]);
}

it('requires authentication', function () {
    $this->getJson('/api/v1/instructor/trends')->assertUnauthorized();
});

it('is reserved for instructors', function () {
    $student = User::factory()->create();
    $student->assignRole('Student');

    $this->actingAs($student)
        ->getJson('/api/v1/instructor/trends')
        ->assertForbidden();
});

it('returns exactly one bucket per day, ending today', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/trends?days=14');

    $response->assertOk()
        ->assertJsonCount(14, 'data.series')
        ->assertJsonPath('data.range.days', 14)
        ->assertJsonPath('data.range.to', now()->toDateString())
        ->assertJsonPath('data.range.from', now()->subDays(13)->toDateString())
        ->assertJsonPath('data.totals.enrollments', 0)
        ->assertJsonPath('data.totals.completions', 0);

    // Every day is present exactly once, in ascending order.
    $dates = array_column($response->json('data.series'), 'date');
    $ascending = $dates;
    sort($ascending);

    expect($dates)->toBe(array_values(array_unique($dates)))
        ->and($dates)->toBe($ascending);
});

it('buckets activity on the day it happened', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    $course = trendOwnedCourse($instructor);
    $student = User::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'enrolled_at' => now()->subDays(2),
    ]);

    CourseProgress::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/trends?days=7');

    $response->assertOk()
        ->assertJsonPath('data.totals.enrollments', 1)
        ->assertJsonPath('data.totals.completions', 1);

    $series = collect($response->json('data.series'));

    expect($series->firstWhere('date', now()->subDays(2)->toDateString())['enrollments'])->toBe(1)
        ->and($series->firstWhere('date', now()->toDateString())['completions'])->toBe(1)
        ->and($series->firstWhere('date', now()->subDays(4)->toDateString()))->toBe([
            'date' => now()->subDays(4)->toDateString(),
            'enrollments' => 0,
            'completions' => 0,
        ]);
});

it('never mixes in another instructors activity', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    $other = User::factory()->create();
    $other->assignRole('Instructor');

    $otherCourse = trendOwnedCourse($other);
    Enrollment::factory()->create([
        'user_id' => User::factory(),
        'course_id' => $otherCourse->id,
        'enrolled_at' => now(),
    ]);

    $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/trends')
        ->assertOk()
        ->assertJsonPath('data.totals.enrollments', 0)
        ->assertJsonPath('data.totals.completions', 0);
});

it('clamps the window instead of trusting the caller', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');

    $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/trends?days=1')
        ->assertOk()
        ->assertJsonCount(7, 'data.series');

    $this->actingAs($instructor)
        ->getJson('/api/v1/instructor/trends?days=99999')
        ->assertOk()
        ->assertJsonCount(365, 'data.series');
});
