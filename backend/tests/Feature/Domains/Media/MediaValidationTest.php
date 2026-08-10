<?php

use App\Models\Course;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('requires a file', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->postJson('/api/v1/media', [
            'mediable_type' => Course::class,
            'mediable_id' => $course->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'file',
        ]);

    expect(Media::query()->count())->toBe(0);
});
it('rejects an unsupported mediable type', function () {
    $user = User::factory()->create();

    $file = \Illuminate\Http\UploadedFile::fake()
        ->image('course.jpg');

    $this->actingAs($user)
        ->postJson('/api/v1/media', [
            'file' => $file,
            'mediable_type' => 'App\\Models\\User',
            'mediable_id' => $user->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'mediable_type',
        ]);

    expect(Media::query()->count())->toBe(0);
});
it('rejects an invalid mediable id', function () {
    $user = User::factory()->create();

    $file = \Illuminate\Http\UploadedFile::fake()
        ->image('course.jpg');

    $this->actingAs($user)
        ->postJson('/api/v1/media', [
            'file' => $file,
            'mediable_type' => Course::class,
            'mediable_id' => 'not-a-uuid',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'mediable_id',
        ]);

    expect(Media::query()->count())->toBe(0);
});