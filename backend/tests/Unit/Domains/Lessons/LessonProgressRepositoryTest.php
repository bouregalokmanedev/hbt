<?php

use App\Domains\Lessons\Repositories\LessonProgressRepositoryInterface;
use App\Domains\Lessons\Repositories\EloquentLessonProgressRepository;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;


uses(RefreshDatabase::class);

beforeEach(function () {
    $this->repository = app(
        LessonProgressRepositoryInterface::class
    );

    $this->user = User::factory()->create();

    $this->lesson = Lesson::factory()->create();
});

it('resolves the repository through its interface', function () {
    expect($this->repository)
        ->toBeInstanceOf(EloquentLessonProgressRepository::class);
});

it('finds progress by user and lesson', function () {
    $progress = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
    ]);

    $result = $this->repository->findByUserAndLesson(
        $this->user->id,
        $this->lesson->id
    );

    expect($result)
        ->not->toBeNull()
        ->and($result->is($progress))
        ->toBeTrue();
});

it('returns null when progress does not exist', function () {
    $result = $this->repository->findByUserAndLesson(
        $this->user->id,
        $this->lesson->id
    );

    expect($result)->toBeNull();
});

it('does not return another users progress', function () {
    $otherUser = User::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $otherUser->id,
        'lesson_id' => $this->lesson->id,
    ]);

    $result = $this->repository->findByUserAndLesson(
        $this->user->id,
        $this->lesson->id
    );

    expect($result)->toBeNull();
});

it('does not return progress for another lesson', function () {
    $otherLesson = Lesson::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $otherLesson->id,
    ]);

    $result = $this->repository->findByUserAndLesson(
        $this->user->id,
        $this->lesson->id
    );

    expect($result)->toBeNull();
});

it('creates lesson progress', function () {
    $progress = $this->repository->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
        'completed_at' => now(),
    ]);

    expect($progress)
        ->toBeInstanceOf(LessonProgress::class)
        ->and($progress->exists)
        ->toBeTrue()
        ->and($progress->user_id)
        ->toBe($this->user->id)
        ->and($progress->lesson_id)
        ->toBe($this->lesson->id)
        ->and($progress->completed_at)
        ->not->toBeNull();
});

it('updates lesson progress', function () {
    $originalCompletedAt = now()->subHour()->startOfSecond();
    $newCompletedAt = now()->addHour()->startOfSecond();

    $progress = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
        'completed_at' => $originalCompletedAt,
    ]);

    $updated = $this->repository->update(
        $progress,
        [
            'completed_at' => $newCompletedAt,
        ]
    );

    expect($updated->completed_at)
        ->toEqual($newCompletedAt)
        ->and(
            LessonProgress::query()
                ->find($progress->id)
                ->completed_at
        )
        ->toEqual($newCompletedAt);
});

it('returns the refreshed model after updating', function () {
    $progress = LessonProgress::factory()->create([
        'user_id' => $this->user->id,
        'lesson_id' => $this->lesson->id,
    ]);

    $newCompletedAt = now()->addHour()->startOfSecond();

    $updated = $this->repository->update(
        $progress,
        [
            'completed_at' => $newCompletedAt,
        ]
    );

    expect($updated)
        ->toBe($progress)
        ->and($updated->exists)
        ->toBeTrue()
        ->and($updated->fresh()->completed_at)
        ->toEqual($newCompletedAt);
});
it('finds progress by id', function () {
    $progress = LessonProgress::factory()->create();

    $result = $this->repository->find(
        $progress->id
    );

    expect($result)
        ->not->toBeNull()
        ->and($result->is($progress))
        ->toBeTrue();
});

it('returns null when progress id does not exist', function () {
    $result = $this->repository->find(
        '00000000-0000-0000-0000-000000000000'
    );

    expect($result)
        ->toBeNull();
});

it('finds progress or fails by id', function () {
    $progress = LessonProgress::factory()->create();

    $result = $this->repository->findOrFail(
        $progress->id
    );

    expect($result->is($progress))
        ->toBeTrue();
});

it('throws when progress id does not exist', function () {
    expect(fn () =>
        $this->repository->findOrFail(
            '00000000-0000-0000-0000-000000000000'
        )
    )->toThrow(
        \Illuminate\Database\Eloquent\ModelNotFoundException::class
    );
});

it('finds all progress for a user', function () {
    $user = User::factory()->create();

    $first = LessonProgress::factory()->create([
        'user_id' => $user->id,
    ]);

    $second = LessonProgress::factory()->create([
        'user_id' => $user->id,
    ]);

    LessonProgress::factory()->create();

    $result = $this->repository->findByUser(
        $user->id
    );

    expect($result)
        ->toHaveCount(2)
        ->and($result->pluck('id'))
        ->toContain($first->id)
        ->toContain($second->id);
});

it('finds all progress for a lesson', function () {
    $lesson = Lesson::factory()->create();

    $first = LessonProgress::factory()->create([
        'lesson_id' => $lesson->id,
    ]);

    $second = LessonProgress::factory()->create([
        'lesson_id' => $lesson->id,
    ]);

    LessonProgress::factory()->create();

    $result = $this->repository->findByLesson(
        $lesson->id
    );

    expect($result)
        ->toHaveCount(2)
        ->and($result->pluck('id'))
        ->toContain($first->id)
        ->toContain($second->id);
});