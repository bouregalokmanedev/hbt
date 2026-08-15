<?php

use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates course progress', function () {
    $progress = CourseProgress::factory()->create();

    expect($progress->id)
        ->not->toBeNull()
        ->and($progress->user_id)
        ->not->toBeNull()
        ->and($progress->course_id)
        ->not->toBeNull()
        ->and($progress->progress_percentage)
        ->toBe(0)
        ->and($progress->time_spent)
        ->toBe(0)
        ->and($progress->started_at)
        ->toBeNull()
        ->and($progress->completed_at)
        ->toBeNull();
});

it('uses a uuid as its primary key', function () {
    $progress = CourseProgress::factory()->create();

    expect($progress->id)
        ->toBeString()
        ->and(strlen($progress->id))
        ->toBe(36);
});

it('belongs to a user', function () {
    $user = User::factory()->create();

    $progress = CourseProgress::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($progress->user->is($user))
        ->toBeTrue();
});

it('belongs to a course', function () {
    $course = Course::factory()->create();

    $progress = CourseProgress::factory()->create([
        'course_id' => $course->id,
    ]);

    expect($progress->course->is($course))
        ->toBeTrue();
});

it('casts started_at to a datetime', function () {
    $startedAt = now()->startOfSecond();

    $progress = CourseProgress::factory()->create([
        'started_at' => $startedAt,
    ]);

    expect($progress->started_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class)
        ->toEqual($startedAt);
});

it('casts progress percentage to an integer', function () {
    $progress = CourseProgress::factory()->create([
        'progress_percentage' => 65,
    ]);

    expect($progress->progress_percentage)
        ->toBeInt()
        ->toBe(65);
});

it('casts time spent to an integer', function () {
    $progress = CourseProgress::factory()->create([
        'time_spent' => 3600,
    ]);

    expect($progress->time_spent)
        ->toBeInt()
        ->toBe(3600);
});

it('casts completed_at to a datetime', function () {
    $completedAt = now()->startOfSecond();

    $progress = CourseProgress::factory()->create([
        'completed_at' => $completedAt,
    ]);

    expect($progress->completed_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class)
        ->toEqual($completedAt);
});

it('defaults course progress percentage to zero', function () {
    $progress = CourseProgress::factory()->create();

    expect($progress->progress_percentage)
        ->toBe(0);
});

it('defaults time spent to zero', function () {
    $progress = CourseProgress::factory()->create();

    expect($progress->time_spent)
        ->toBe(0);
});

it('creates an in progress course', function () {
    $startedAt = now()->startOfSecond();

    $progress = CourseProgress::factory()->create([
        'started_at' => $startedAt,
        'progress_percentage' => 45,
        'time_spent' => 1800,
        'completed_at' => null,
    ]);

    expect($progress->started_at)
        ->toEqual($startedAt)
        ->and($progress->progress_percentage)
        ->toBe(45)
        ->and($progress->time_spent)
        ->toBe(1800)
        ->and($progress->completed_at)
        ->toBeNull();
});

it('creates a completed course', function () {
    $completedAt = now()->startOfSecond();

    $progress = CourseProgress::factory()->create([
        'progress_percentage' => 100,
        'completed_at' => $completedAt,
    ]);

    expect($progress->progress_percentage)
        ->toBe(100)
        ->and($progress->completed_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class)
        ->and($progress->completed_at)
        ->toEqual($completedAt);
});

it('stores the course start timestamp', function () {
    $startedAt = now()->startOfSecond();

    $progress = CourseProgress::factory()->create([
        'started_at' => $startedAt,
    ]);

    expect($progress->started_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class)
        ->toEqual($startedAt);
});

it('stores a course progress percentage', function () {
    $progress = CourseProgress::factory()->create([
        'progress_percentage' => 75,
    ]);

    expect($progress->progress_percentage)
        ->toBe(75);
});

it('allows completed progress percentage', function () {
    $progress = CourseProgress::factory()->create([
        'progress_percentage' => 100,
    ]);

    expect($progress->progress_percentage)
        ->toBe(100);
});

it('stores course time spent', function () {
    $progress = CourseProgress::factory()->create([
        'time_spent' => 7200,
    ]);

    expect($progress->time_spent)
        ->toBe(7200);
});

it('does not allow duplicate progress for the same user and course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    expect(fn () => CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]))->toThrow(QueryException::class);
});

it('allows the same course to have progress for different users', function () {
    $course = Course::factory()->create();

    $first = CourseProgress::factory()->create([
        'user_id' => User::factory()->create()->id,
        'course_id' => $course->id,
    ]);

    $second = CourseProgress::factory()->create([
        'user_id' => User::factory()->create()->id,
        'course_id' => $course->id,
    ]);

    expect($first->id)
        ->not->toBe($second->id);
});

it('allows the same user to have progress for different courses', function () {
    $user = User::factory()->create();

    $first = CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => Course::factory()->create()->id,
    ]);

    $second = CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => Course::factory()->create()->id,
    ]);

    expect($first->id)
        ->not->toBe($second->id);
});
