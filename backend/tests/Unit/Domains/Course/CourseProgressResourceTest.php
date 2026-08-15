<?php

use App\Domains\Courses\Resources\CourseProgressResource;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('transforms course progress into an api resource', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $progress = CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'started_at' => now()->subHour()->startOfSecond(),
        'progress_percentage' => 65,
        'time_spent' => 1800,
        'completed_at' => null,
    ]);

    $resource = new CourseProgressResource($progress);

    $array = $resource->toArray(request());

    expect($array)->toMatchArray([
        'id' => $progress->id,
        'user_id' => $progress->user_id,
        'course_id' => $progress->course_id,
        'started_at' => $progress->started_at->toISOString(),
        'progress_percentage' => 65,
        'time_spent' => 1800,
        'completed_at' => null,
        'created_at' => $progress->created_at->toISOString(),
        'updated_at' => $progress->updated_at->toISOString(),
    ]);
});

it('returns a null started_at for a course that has not started', function () {
    $progress = CourseProgress::factory()->create([
        'started_at' => null,
        'progress_percentage' => 0,
        'time_spent' => 0,
        'completed_at' => null,
    ]);

    $resource = new CourseProgressResource($progress);

    $array = $resource->toArray(request());

    expect($array['started_at'])
        ->toBeNull()
        ->and($array['completed_at'])
        ->toBeNull();
});

it('returns completed_at when the course is completed', function () {
    $completedAt = now()->startOfSecond();

    $progress = CourseProgress::factory()->create([
        'started_at' => $completedAt->copy()->subHour(),
        'progress_percentage' => 100,
        'time_spent' => 3600,
        'completed_at' => $completedAt,
    ]);

    $resource = new CourseProgressResource($progress);

    $array = $resource->toArray(request());

    expect($array['progress_percentage'])
        ->toBe(100)
        ->and($array['completed_at'])
        ->toBe($completedAt->toISOString());
});
