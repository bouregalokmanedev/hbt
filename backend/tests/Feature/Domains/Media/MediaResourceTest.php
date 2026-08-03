<?php


use App\Models\Course;
use App\Models\Media;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns the expected media resource representation', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $media = Media::factory()->create([
        'uploaded_by' => $user->id,
        'disk' => 'public',
        'path' => 'media/course.jpg',
        'mediable_type' => Course::class,
        'mediable_id' => $course->id,
    ]);

    $response = $this->actingAs($user)
        ->getJson("/api/v1/media/{$media->id}");

    $response
        ->assertOk()
        ->assertJsonPath('data.id', $media->id)
        ->assertJsonPath('data.disk', 'public')
        ->assertJsonPath('data.path', 'media/course.jpg')
        ->assertJsonPath('data.type', 'image');
});