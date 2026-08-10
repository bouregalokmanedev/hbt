<?php

use App\Domains\Media\Actions\UploadMediaAction;
use App\Domains\Media\Events\MediaUploaded;
use App\Models\Course;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

it('uploads a file and creates its media record', function () {
    Event::fake();

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $file = UploadedFile::fake()->image(
        'lesson.jpg'
    );

    $action = app(UploadMediaAction::class);

    $media = $action->execute(
        file: $file,
        mediableType: Course::class,
        mediableId: $course->id,
        uploadedBy: $user->id,
    );

    expect($media)
        ->toBeInstanceOf(Media::class)
        ->and($media->uploaded_by)
        ->toBe($user->id)
        ->and($media->mediable_id)
        ->toBe($course->id);

    Storage::disk('public')
        ->assertExists($media->path);

    Event::assertDispatched(
        MediaUploaded::class,
        fn (MediaUploaded $event) =>
            $event->media->is($media)
    );
});
it('removes the physical file when media persistence fails', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $file = UploadedFile::fake()->image(
        'failure.jpg'
    );

    $repository = Mockery::mock(
        \App\Domains\Media\Repositories\MediaRepositoryInterface::class
    );

    $repository
        ->shouldReceive('create')
        ->once()
        ->andThrow(
            new RuntimeException('Database failure')
        );

    app()->instance(
        \App\Domains\Media\Repositories\MediaRepositoryInterface::class,
        $repository
    );

    expect(fn () =>
        app(UploadMediaAction::class)->execute(
            file: $file,
            mediableType: Course::class,
            mediableId: $course->id,
            uploadedBy: $user->id,
        )
    )->toThrow(RuntimeException::class);

    expect(
        Storage::disk('public')->allFiles('media')
    )->toBe([]);
});