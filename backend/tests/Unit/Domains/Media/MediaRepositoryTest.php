<?php

use App\Domains\Media\Repositories\EloquentMediaRepository;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a media record through the repository', function () {
    $user = User::factory()->create();

    $repository = app(EloquentMediaRepository::class);

    $media = $repository->create([
        'uploaded_by' => $user->id,
        'disk' => 'public',
        'path' => 'media/example.jpg',
        'original_name' => 'example.jpg',
        'filename' => 'example.jpg',
        'mime_type' => 'image/jpeg',
        'extension' => 'jpg',
        'size' => 12345,
        'type' => 'image',
        'metadata' => null,
    ]);

    expect($media)
        ->toBeInstanceOf(Media::class)
        ->and($media->exists)->toBeTrue();

    expect(
        Media::query()->find($media->id)
    )->not->toBeNull();
});

it('deletes a media record through the repository', function () {
    $media = Media::factory()->create();

    $repository = app(EloquentMediaRepository::class);

    $repository->delete($media);

    expect(
        Media::query()->find($media->id)
    )->toBeNull();
});