<?php

use App\Domains\Media\Actions\DeleteMediaAction;
use App\Models\Media;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

it('deletes the physical file and database record', function () {
    $file = UploadedFile::fake()->image(
        'example.jpg'
    );

    $path = $file->store(
        'media',
        'public'
    );

    $media = Media::factory()->create([
        'disk' => 'public',
        'path' => $path,
    ]);

    Storage::disk('public')
        ->assertExists($path);

    app(DeleteMediaAction::class)
        ->execute($media);

    expect(
        Media::query()->find($media->id)
    )->toBeNull();

    Storage::disk('public')
        ->assertMissing($path);
});