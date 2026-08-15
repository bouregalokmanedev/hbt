<?php

use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);


it('creates lesson progress', function () {
    $progress = LessonProgress::factory()->create();

    expect($progress->id)
        ->not->toBeNull()
        ->and($progress->user_id)
        ->not->toBeNull()
        ->and($progress->lesson_id)
        ->not->toBeNull()
        ->and($progress->started_at)
        ->not->toBeNull()
        ->and($progress->progress_percentage)
        ->toBe(0)
        ->and($progress->time_spent)
        ->toBe(0)
        ->and($progress->completed_at)
        ->toBeNull();
});
it('uses a uuid as its primary key', function () {
    $progress = LessonProgress::factory()->create();

    expect($progress->id)
        ->toBeString()
        ->and(strlen($progress->id))
        ->toBe(36);
});

it('belongs to a user', function () {
    $user = User::factory()->create();

    $progress = LessonProgress::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($progress->user->is($user))
        ->toBeTrue();
});

it('belongs to a lesson', function () {
    $lesson = Lesson::factory()->create();

    $progress = LessonProgress::factory()->create([
        'lesson_id' => $lesson->id,
    ]);

    expect($progress->lesson->is($lesson))
        ->toBeTrue();
});

it('casts completed_at to a datetime', function () {
    $progress = LessonProgress::factory()
        ->completed()
        ->create();

    expect($progress->completed_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});

it('does not allow duplicate progress for the same user and lesson', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
    ]);

    expect(fn () => LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
    ]))->toThrow(QueryException::class);
});
it('creates lesson progress with default incomplete state', function () {
    $progress = LessonProgress::factory()->create();

    expect($progress->progress_percentage)->toBe(0)
        ->and($progress->time_spent)->toBe(0)
        ->and($progress->started_at)->not->toBeNull()
        ->and($progress->completed_at)->toBeNull();
});
it('stores lesson positions and time spent', function () {
    $progress = LessonProgress::factory()->create([
        'progress_percentage' => 65,
        'time_spent' => 900,
        'last_position' => 7,
        'video_position' => 420,
    ]);

    expect($progress->progress_percentage)->toBe(65)
        ->and($progress->time_spent)->toBe(900)
        ->and($progress->last_position)->toBe(7)
        ->and($progress->video_position)->toBe(420);
});
it('casts progress fields correctly', function () {
    $progress = LessonProgress::factory()->create();

    expect($progress->started_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class)
        ->and($progress->progress_percentage)
        ->toBeInt()
        ->and($progress->time_spent)
        ->toBeInt();
});
it('creates an in progress lesson', function () {
    $progress = LessonProgress::factory()
        ->inProgress()
        ->create();

    expect($progress->progress_percentage)
        ->toBe(50)
        ->and($progress->completed_at)
        ->toBeNull();
});

it('creates a completed lesson', function () {
    $progress = LessonProgress::factory()
        ->completed()
        ->create();

    expect($progress->progress_percentage)
        ->toBe(100)
        ->and($progress->completed_at)
        ->not->toBeNull();
});
it('stores the lesson start timestamp', function () {
    $startedAt = now()->subMinutes(5);

    $progress = LessonProgress::factory()->create([
        'started_at' => $startedAt,
    ]);

    expect($progress->started_at->timestamp)
    ->toBe($startedAt->timestamp);
});
it('defaults lesson progress percentage to zero', function () {
    $progress = LessonProgress::factory()->create();

    expect($progress->progress_percentage)
        ->toBe(0);
});

it('stores a lesson progress percentage', function () {
    $progress = LessonProgress::factory()->create([
        'progress_percentage' => 65,
    ]);

    expect($progress->progress_percentage)
        ->toBe(65);
});

it('allows completed progress percentage', function () {
    $progress = LessonProgress::factory()->create([
        'progress_percentage' => 100,
    ]);

    expect($progress->progress_percentage)
        ->toBe(100);
});