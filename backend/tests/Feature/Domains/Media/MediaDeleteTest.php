

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




it('deletes the media record and physical file', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $media = Media::factory()->create([
        'uploaded_by' => $user->id,
        'mediable_type' => Course::class,
        'mediable_id' => $course->id,
        'disk' => 'public',
        'path' => 'media/example.jpg',
    ]);

    Storage::disk('public')
        ->put($media->path, 'fake content');

    $this->actingAs($user)
        ->deleteJson(
            "/api/v1/media/{$media->id}"
        )
        ->assertNoContent();

    expect(
        Media::query()->find($media->id)
    )->toBeNull();

    Storage::disk('public')
        ->assertMissing($media->path);
});