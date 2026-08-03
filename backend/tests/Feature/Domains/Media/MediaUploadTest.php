<?php

use App\Models\Course;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

it('uploads an image and creates a media record', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $file = UploadedFile::fake()->image(
        'course-thumbnail.jpg',
        1200,
        800
    );

    $response = $this->actingAs($user)
        ->postJson('/api/v1/media', [
            'file' => $file,
            'mediable_type' => Course::class,
            'mediable_id' => $course->id,
        ]);

    $response
        ->assertCreated()
        ->assertJsonPath('data.original_name', 'course-thumbnail.jpg')
        ->assertJsonPath('data.mime_type', 'image/jpeg')
        ->assertJsonPath('data.type', 'image')
        ->assertJsonPath('data.disk', 'public');

    $media = Media::query()->first();

    expect($media)->not->toBeNull()
        ->and($media->uploaded_by)->toBe($user->id)
        ->and($media->mediable_id)->toBe($course->id);

    Storage::disk('public')->assertExists($media->path);
});

it('rejects an unsupported file type', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $file = UploadedFile::fake()->create(
        'malware.exe',
        100,
        'application/x-msdownload'
    );

    $this->actingAs($user)
        ->postJson('/api/v1/media', [
            'file' => $file,
            'mediable_type' => Course::class,
            'mediable_id' => $course->id,
        ])
        ->assertUnprocessable();

    expect(Media::query()->count())->toBe(0);
});

it('requires authentication', function () {
    $course = Course::factory()->create();

    $file = UploadedFile::fake()->image('course.jpg');

    $this->postJson('/api/v1/media', [
        'file' => $file,
        'mediable_type' => Course::class,
        'mediable_id' => $course->id,
    ])->assertUnauthorized();
});

it('does not allow an instructor to upload to another instructors course', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $owner->id,
    ]);

    $file = UploadedFile::fake()->image('course.jpg');

    $this->actingAs($otherUser)
        ->postJson('/api/v1/media', [
            'file' => $file,
            'mediable_type' => Course::class,
            'mediable_id' => $course->id,
        ])
        ->assertForbidden();

    expect(Media::query()->count())->toBe(0);
});