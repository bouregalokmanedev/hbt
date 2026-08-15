<?php

use App\Domains\Courses\Repositories\CourseProgressRepositoryInterface;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('resolves the repository through its interface', function () {
    $repository = app(CourseProgressRepositoryInterface::class);

    expect($repository)
        ->toBeInstanceOf(
            \App\Domains\Courses\Repositories\EloquentCourseProgressRepository::class
        );
});

it('finds progress by user and course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $progress = CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->findByUserAndCourse(
        $user->id,
        $course->id
    );

    expect($result)
        ->not->toBeNull()
        ->and($result->is($progress))
        ->toBeTrue();
});

it('returns null when progress does not exist', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->findByUserAndCourse(
        $user->id,
        $course->id
    );

    expect($result)
        ->toBeNull();
});

it('does not return another users progress', function () {
    $firstUser = User::factory()->create();
    $secondUser = User::factory()->create();
    $course = Course::factory()->create();

    CourseProgress::factory()->create([
        'user_id' => $firstUser->id,
        'course_id' => $course->id,
    ]);

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->findByUserAndCourse(
        $secondUser->id,
        $course->id
    );

    expect($result)
        ->toBeNull();
});

it('does not return progress for another course', function () {
    $user = User::factory()->create();
    $firstCourse = Course::factory()->create();
    $secondCourse = Course::factory()->create();

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $firstCourse->id,
    ]);

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->findByUserAndCourse(
        $user->id,
        $secondCourse->id
    );

    expect($result)
        ->toBeNull();
});

it('creates course progress', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $repository = app(CourseProgressRepositoryInterface::class);

    $progress = $repository->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'started_at' => now()->startOfSecond(),
        'progress_percentage' => 40,
        'time_spent' => 900,
    ]);

    expect($progress)
        ->toBeInstanceOf(CourseProgress::class)
        ->and($progress->user_id)
        ->toBe($user->id)
        ->and($progress->course_id)
        ->toBe($course->id)
        ->and($progress->progress_percentage)
        ->toBe(40)
        ->and($progress->time_spent)
        ->toBe(900);
});

it('updates course progress', function () {
    $progress = CourseProgress::factory()->create([
        'progress_percentage' => 20,
        'time_spent' => 300,
    ]);

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->update($progress, [
        'progress_percentage' => 75,
        'time_spent' => 1200,
    ]);

    expect($result->progress_percentage)
        ->toBe(75)
        ->and($result->time_spent)
        ->toBe(1200);
});

it('returns the refreshed model after updating', function () {
    $progress = CourseProgress::factory()->create([
        'progress_percentage' => 20,
    ]);

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->update($progress, [
        'progress_percentage' => 80,
    ]);

    expect($result)
        ->not->toBe($progress)
        ->and($result->id)
        ->toBe($progress->id)
        ->and($result->progress_percentage)
        ->toBe(80);
});

it('finds progress by id', function () {
    $progress = CourseProgress::factory()->create();

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->find($progress->id);

    expect($result)
        ->not->toBeNull()
        ->and($result->is($progress))
        ->toBeTrue();
});

it('returns null when progress id does not exist', function () {
    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->find('00000000-0000-0000-0000-000000000000');

    expect($result)
        ->toBeNull();
});

it('finds progress or fails by id', function () {
    $progress = CourseProgress::factory()->create();

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->findOrFail($progress->id);

    expect($result->is($progress))
        ->toBeTrue();
});

it('throws when finding an unknown progress id', function () {
    $repository = app(CourseProgressRepositoryInterface::class);

    expect(fn () => $repository->findOrFail(
        '00000000-0000-0000-0000-000000000000'
    ))->toThrow(
        \Illuminate\Database\Eloquent\ModelNotFoundException::class
    );
});

it('finds all progress for a user', function () {
    $user = User::factory()->create();

    $firstCourse = Course::factory()->create();
    $secondCourse = Course::factory()->create();

    $first = CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $firstCourse->id,
    ]);

    $second = CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $secondCourse->id,
    ]);

    CourseProgress::factory()->create();

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->findByUser($user->id);

    expect($result)
        ->toHaveCount(2)
        ->and($result->pluck('id'))
        ->toContain($first->id)
        ->toContain($second->id);
});

it('does not include another users progress when finding by user', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $course = Course::factory()->create();

    $progress = CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    CourseProgress::factory()->create([
        'user_id' => $otherUser->id,
        'course_id' => $course->id,
    ]);

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->findByUser($user->id);

    expect($result)
        ->toHaveCount(1)
        ->and($result->first()->is($progress))
        ->toBeTrue();
});

it('finds all progress for a course', function () {
    $course = Course::factory()->create();

    $firstUser = User::factory()->create();
    $secondUser = User::factory()->create();

    $first = CourseProgress::factory()->create([
        'user_id' => $firstUser->id,
        'course_id' => $course->id,
    ]);

    $second = CourseProgress::factory()->create([
        'user_id' => $secondUser->id,
        'course_id' => $course->id,
    ]);

    CourseProgress::factory()->create();

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->findByCourse($course->id);

    expect($result)
        ->toHaveCount(2)
        ->and($result->pluck('id'))
        ->toContain($first->id)
        ->toContain($second->id);
});

it('does not include another courses progress when finding by course', function () {
    $course = Course::factory()->create();
    $otherCourse = Course::factory()->create();

    $user = User::factory()->create();

    $progress = CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $otherCourse->id,
    ]);

    $repository = app(CourseProgressRepositoryInterface::class);

    $result = $repository->findByCourse($course->id);

    expect($result)
        ->toHaveCount(1)
        ->and($result->first()->is($progress))
        ->toBeTrue();
});
