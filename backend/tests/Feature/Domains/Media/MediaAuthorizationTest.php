<?php

use App\Models\Course;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use App\Models\Section;
use App\Models\Lesson;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');

    Role::findOrCreate('Admin', 'web');
    Role::findOrCreate('Super Admin', 'web');
    Role::findOrCreate('Instructor', 'web');
});



it('allows an admin to upload to another instructors course', function () {
    Storage::fake('public');

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $owner = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $owner->id,
    ]);

    $file = UploadedFile::fake()
        ->image('course.jpg');

    $this->actingAs($admin)
        ->postJson('/api/v1/media', [
            'file' => $file,
            'mediable_type' => Course::class,
            'mediable_id' => $course->id,
        ])
        ->assertCreated();

    expect(Media::query()->count())
        ->toBe(1);
});
it('uploads media to a lesson owned by the instructor', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $section = Section::factory()->create([
        'course_id' => $course->id,
    ]);

    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
    ]);

    $file = UploadedFile::fake()
        ->create(
            'lesson.pdf',
            100,
            'application/pdf'
        );

    $this->actingAs($user)
        ->postJson('/api/v1/media', [
            'file' => $file,
            'mediable_type' => Lesson::class,
            'mediable_id' => $lesson->id,
        ])
        ->assertCreated()
        ->assertJsonPath(
            'data.type',
            'document'
        );

    expect(Media::query()->count())
        ->toBe(1);
});
it('rejects a non-existent mediable', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $file = UploadedFile::fake()
        ->image('course.jpg');

    $this->actingAs($user)
        ->postJson('/api/v1/media', [
            'file' => $file,
            'mediable_type' => Course::class,
            'mediable_id' => fake()->uuid(),
        ])
        ->assertForbidden();

    expect(Media::query()->count())
        ->toBe(0);
});
it('allows the owner to delete media', function () {
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

    Storage::disk('public')->put(
        $media->path,
        'fake content'
    );

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
it('does not allow another instructor to delete media', function () {
    Storage::fake('public');

    $owner = User::factory()->create();

    $otherUser = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $owner->id,
    ]);

    $media = Media::factory()->create([
        'uploaded_by' => $owner->id,
        'disk' => 'public',
        'path' => 'media/course.jpg',
        'mediable_type' => Course::class,
        'mediable_id' => $course->id,
    ]);

    Storage::disk('public')->put(
        $media->path,
        'fake content'
    );

    $this->actingAs($otherUser)
        ->deleteJson(
            "/api/v1/media/{$media->id}"
        )
        ->assertForbidden();

    expect(
        Media::query()->find($media->id)
    )->not->toBeNull();

    Storage::disk('public')
        ->assertExists($media->path);
});
it('allows an admin to delete media owned by another instructor', function () {
    Storage::fake('public');

    $admin = User::factory()->create();
    $admin->assignRole('Admin');

    $owner = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $owner->id,
    ]);

    $media = Media::factory()->create([
        'uploaded_by' => $owner->id,
        'disk' => 'public',
        'path' => 'media/course.jpg',
        'mediable_type' => Course::class,
        'mediable_id' => $course->id,
    ]);

    Storage::disk('public')->put(
        $media->path,
        'fake content'
    );

    $this->actingAs($admin)
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
it('deletes the media record even when the physical file is already missing', function () {
    Storage::fake('public');

    $user = User::factory()->create();

    $course = Course::factory()->create([
        'instructor_id' => $user->id,
    ]);

    $media = Media::factory()->create([
        'uploaded_by' => $user->id,
        'disk' => 'public',
        'path' => 'media/missing.jpg',
        'mediable_type' => Course::class,
        'mediable_id' => $course->id,
    ]);

    $this->actingAs($user)
        ->deleteJson(
            "/api/v1/media/{$media->id}"
        )
        ->assertNoContent();

    expect(
        Media::query()->find($media->id)
    )->toBeNull();
});