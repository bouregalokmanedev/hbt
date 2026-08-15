<?php

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use App\Domains\Courses\Resources\CourseProgressResource;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();

    $this->otherUser = User::factory()->create();

    $this->course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);
});

it('returns the authenticated users course progress', function () {
    $progress = CourseProgress::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'progress_percentage' => 65,
        'time_spent' => 1800,
        'started_at' => now()->subHour(),
    ]);

    $response = $this
        ->actingAs($this->user)
        ->getJson("/api/courses/{$this->course->id}/progress");

    $response
        ->assertOk()
        ->assertJsonPath('data.id', $progress->id)
        ->assertJsonPath('data.user_id', $this->user->id)
        ->assertJsonPath('data.course_id', $this->course->id)
        ->assertJsonPath('data.progress_percentage', 65)
        ->assertJsonPath('data.time_spent', 1800);
});

it('rejects an unauthenticated user', function () {
    $response = $this->getJson(
        "/api/courses/{$this->course->id}/progress"
    );

    $response->assertUnauthorized();
});

it('does not return another users course progress', function () {
    CourseProgress::factory()->create([
        'user_id' => $this->otherUser->id,
        'course_id' => $this->course->id,
        'progress_percentage' => 75,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->getJson("/api/courses/{$this->course->id}/progress");

    $response->assertNotFound();
});

it('returns started_at when course progress has started', function () {
    $startedAt = now()->subHour()->startOfSecond();

    CourseProgress::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'started_at' => $startedAt,
        'progress_percentage' => 20,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->getJson("/api/courses/{$this->course->id}/progress");

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.started_at',
            $startedAt->toISOString()
        );
});

it('returns null completed_at for incomplete course progress', function () {
    CourseProgress::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'progress_percentage' => 50,
        'completed_at' => null,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->getJson("/api/courses/{$this->course->id}/progress");

    $response
        ->assertOk()
        ->assertJsonPath('data.progress_percentage', 50)
        ->assertJsonPath('data.completed_at', null);
});

it('returns completed_at when the course is completed', function () {
    $completedAt = now()->startOfSecond();

    CourseProgress::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'progress_percentage' => 100,
        'time_spent' => 3600,
        'started_at' => $completedAt->copy()->subHour(),
        'completed_at' => $completedAt,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->getJson("/api/courses/{$this->course->id}/progress");

    $response
        ->assertOk()
        ->assertJsonPath('data.progress_percentage', 100)
        ->assertJsonPath(
            'data.completed_at',
            $completedAt->toISOString()
        );
});

it('returns zero progress when course progress has not started', function () {
    CourseProgress::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'progress_percentage' => 0,
        'time_spent' => 0,
        'started_at' => null,
        'completed_at' => null,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->getJson("/api/courses/{$this->course->id}/progress");

    $response
        ->assertOk()
        ->assertJsonPath('data.progress_percentage', 0)
        ->assertJsonPath('data.time_spent', 0)
        ->assertJsonPath('data.started_at', null)
        ->assertJsonPath('data.completed_at', null);
});

it('does not create duplicate course progress for the same user and course', function () {
    CourseProgress::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
    ]);

    expect(
        CourseProgress::query()
            ->where('user_id', $this->user->id)
            ->where('course_id', $this->course->id)
            ->count()
    )->toBe(1);
});

it('returns the course progress resource shape', function () {
    $progress = CourseProgress::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $this->course->id,
        'progress_percentage' => 40,
        'time_spent' => 900,
    ]);

    $response = $this
        ->actingAs($this->user)
        ->getJson("/api/courses/{$this->course->id}/progress");

    $response
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'id',
                'user_id',
                'course_id',
                'started_at',
                'progress_percentage',
                'time_spent',
                'completed_at',
                'created_at',
                'updated_at',
            ],
        ]);
});
