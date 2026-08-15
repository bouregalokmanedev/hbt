<?php

use App\Domains\Courses\Services\SectionProgressService;
use App\Enums\LessonStatus;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = app(SectionProgressService::class);

    $this->user = User::factory()->create();

    $this->section = Section::factory()->create();

    $this->lessonOne = Lesson::factory()->create([
        'section_id' => $this->section->id,
        'status' => LessonStatus::PUBLISHED,
        'position' => 1,
    ]);

    $this->lessonTwo = Lesson::factory()->create([
        'section_id' => $this->section->id,
        'status' => LessonStatus::PUBLISHED,
        'position' => 2,
    ]);

    $this->lessonThree = Lesson::factory()->create([
        'section_id' => $this->section->id,
        'status' => LessonStatus::PUBLISHED,
        'position' => 3,
    ]);
});

it('creates section progress', function () {
    $progress = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($progress)
        ->toBeInstanceOf(SectionProgress::class)
        ->and($progress->user_id)
        ->toBe($this->user->id)
        ->and($progress->section_id)
        ->toBe($this->section->id);
});

it('calculates section progress percentage from lesson progress', function () {
    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonOne->id,
        'progress_percentage' => 100,
    ]);

    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonTwo->id,
        'progress_percentage' => 50,
    ]);

    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonThree->id,
        'progress_percentage' => 0,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($progress->progress_percentage)
        ->toBe(50);
});

it('calculates aggregate time spent from lesson progress', function () {
    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonOne->id,
        'time_spent' => 120,
    ]);

    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonTwo->id,
        'time_spent' => 300,
    ]);

    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonThree->id,
        'time_spent' => 80,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($progress->time_spent)
        ->toBe(500);
});

it('uses the earliest lesson started timestamp', function () {
    $earliest = now()->startOfSecond();
    $later = $earliest->copy()->addMinutes(5);

    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonOne->id,
        'started_at' => $later,
    ]);

    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonTwo->id,
        'started_at' => $earliest,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($progress->started_at)
        ->toEqual($earliest);
});

it('leaves started_at null when no lesson has started', function () {
    $progress = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($progress->started_at)
        ->toBeNull();
});

it('marks the section completed when all lessons reach 100 percent', function () {
    foreach ([
        $this->lessonOne,
        $this->lessonTwo,
        $this->lessonThree,
    ] as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $this->user->id,
            'lesson_id' => $lesson->id,
            'progress_percentage' => 100,
            'completed_at' => now(),
        ]);
    }

    $progress = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($progress->progress_percentage)
        ->toBe(100)
        ->and($progress->completed_at)
        ->not->toBeNull();
});

it('does not mark the section completed when any lesson is incomplete', function () {
    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonOne->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonTwo->id,
        'progress_percentage' => 50,
    ]);

    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonThree->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($progress->progress_percentage)
        ->toBe(83)
        ->and($progress->completed_at)
        ->toBeNull();
});

it('does not create duplicate section progress', function () {
    $existing = SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->section->id,
        'progress_percentage' => 20,
    ]);

    $result = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($result->is($existing))
        ->toBeTrue()
        ->and(
            SectionProgress::query()
                ->where('user_id', $this->user->id)
                ->where('section_id', $this->section->id)
                ->count()
        )
        ->toBe(1);
});

it('updates existing section progress', function () {
    $existing = SectionProgress::factory()->create([
        'user_id' => $this->user->id,
        'section_id' => $this->section->id,
        'progress_percentage' => 10,
        'time_spent' => 20,
    ]);

    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonOne->id,
        'progress_percentage' => 100,
        'time_spent' => 200,
    ]);

    $result = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($result->is($existing))
        ->toBeTrue()
        ->and($result->progress_percentage)
        ->toBe(33)
        ->and($result->time_spent)
        ->toBe(200);
});

it('treats lessons without progress as zero percent', function () {
    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lessonOne->id,
        'progress_percentage' => 100,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($progress->progress_percentage)
        ->toBe(33);
});

it('ignores another users lesson progress', function () {
    $otherUser = User::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $otherUser->id,
        'lesson_id' => $this->lessonOne->id,
        'progress_percentage' => 100,
        'time_spent' => 999,
    ]);

    $progress = $this->service->sync(
        $this->user,
        $this->section
    );

    expect($progress->progress_percentage)
        ->toBe(0)
        ->and($progress->time_spent)
        ->toBe(0);
});

it('handles a section with no lessons', function () {
    $section = Section::factory()->create();

    $progress = $this->service->sync(
        $this->user,
        $section
    );

    expect($progress->progress_percentage)
        ->toBe(0)
        ->and($progress->time_spent)
        ->toBe(0)
        ->and($progress->started_at)
        ->toBeNull()
        ->and($progress->completed_at)
        ->toBeNull();
});