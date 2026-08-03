<?php

use App\Domains\Media\Services\MediaService;
use App\Enums\MediaType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('determines image media type', function () {
    $service = new MediaService();

    expect($service->determineType('image/jpeg'))
        ->toBe(MediaType::IMAGE);
});

it('determines video media type', function () {
    $service = new MediaService();

    expect($service->determineType('video/mp4'))
        ->toBe(MediaType::VIDEO);
});

it('determines document media type', function () {
    $service = new MediaService();

    expect($service->determineType('application/pdf'))
        ->toBe(MediaType::DOCUMENT);
});

it('rejects unsupported media types', function () {
    $service = new MediaService();

    expect(fn () =>
        $service->determineType(
            'application/x-msdownload'
        )
    )->toThrow(InvalidArgumentException::class);
});

it('stores uploaded files', function () {
    Storage::fake('public');

    $service = new MediaService();

    $file = UploadedFile::fake()->image(
        'course.jpg'
    );

    $path = $service->store(
        $file,
        'public'
    );

    Storage::disk('public')
        ->assertExists($path);
});

it('deletes stored files', function () {
    Storage::fake('public');

    $service = new MediaService();

    $file = UploadedFile::fake()->image(
        'course.jpg'
    );

    $path = $service->store(
        $file,
        'public'
    );

    Storage::disk('public')
        ->assertExists($path);

    $service->delete(
        'public',
        $path
    );

    Storage::disk('public')
        ->assertMissing($path);
});