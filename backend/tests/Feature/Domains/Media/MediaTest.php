<?php

use App\Models\Course;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('belongs to its uploader', function () {
    $user = User::factory()->create();

    $media = Media::factory()->create([
        'uploaded_by' => $user->id,
    ]);

    expect($media->uploader->is($user))->toBeTrue();
});

it('can belong to a course', function () {
    $course = Course::factory()->create();

    $media = Media::factory()->create([
        'mediable_type' => Course::class,
        'mediable_id' => $course->id,
    ]);

    expect($media->mediable->is($course))->toBeTrue();
});

it('can be retrieved from its course', function () {
    $course = Course::factory()->create();

    $media = Media::factory()->create([
        'mediable_type' => Course::class,
        'mediable_id' => $course->id,
    ]);

    expect($course->media)
        ->toHaveCount(1)
        ->and($course->media->first()->is($media))
        ->toBeTrue();
});