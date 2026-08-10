<?php

use App\Domains\Lessons\Events\LessonCreated;
use App\Domains\Lessons\Events\LessonDeleted;
use App\Domains\Lessons\Events\LessonPublished;
use App\Domains\Lessons\Events\LessonReordered;
use App\Domains\Lessons\Events\LessonUnpublished;
use App\Domains\Lessons\Events\LessonUpdated;
use App\Models\Lesson;
use App\Enums\LessonStatus;
use App\Domains\Lessons\Actions\UnpublishLessonAction;
use App\Domains\Lessons\Repositories\LessonRepositoryInterface;
use Illuminate\Support\Facades\Event;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHasJson;
use function Pest\Laravel\assertDatabaseMissingJson;

it('does not dispatch LessonUnpublished when persistence fails', function () {
    Event::fake();

    $lesson = Lesson::factory()->create([
        'status' => LessonStatus::PUBLISHED,
        'position' => 1,
    ]);

    $repository = Mockery::mock(
        LessonRepositoryInterface::class
    );

    $repository
        ->shouldReceive('update')
        ->once()
        ->andThrow(new RuntimeException('Database failure'));

    app()->instance(
        LessonRepositoryInterface::class,
        $repository
    );

    expect(fn () =>
        app(UnpublishLessonAction::class)->execute($lesson)
    )->toThrow(RuntimeException::class);

    Event::assertNotDispatched(
        LessonUnpublished::class
    );
});

it('creates the lesson created event', function () {
    $lesson = Lesson::factory()->make();

    $event = new LessonCreated($lesson);
   Event::fake([
    LessonCreated::class,
]);

    expect($event->lesson->is($lesson))
        ->toBeTrue();
});

it('creates the lesson updated event', function () {
    $lesson = Lesson::factory()->make();

    $event = new LessonUpdated($lesson);

    expect($event->lesson->is($lesson))
        ->toBeTrue();
});

it('creates the lesson deleted event', function () {
    $lesson = Lesson::factory()->make();

    $event = new LessonDeleted($lesson);

    expect($event->lesson->is($lesson))
        ->toBeTrue();
});

it('creates the lesson published event', function () {
    $lesson = Lesson::factory()->make();

    $event = new LessonPublished($lesson);

    expect($event->lesson->is($lesson))
        ->toBeTrue();
});

it('creates the lesson unpublished event', function () {
    $lesson = Lesson::factory()->make();

    $event = new LessonUnpublished($lesson);

    expect($event->lesson->is($lesson))
        ->toBeTrue();
});

it('creates the lesson reordered event', function () {
    $lesson = Lesson::factory()->make();

    $event = new LessonReordered(
        $lesson,
        3,
        1
    );

    expect($event->lesson->is($lesson))
        ->toBeTrue();

    expect($event->oldPosition)
        ->toBe(3);

    expect($event->newPosition)
        ->toBe(1);
});