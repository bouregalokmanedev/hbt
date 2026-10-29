<?php

namespace Tests\Feature\Domains\Bootcamp;

use App\Enums\Bootcamps\BootcampStatus;
use App\Models\Bootcamp;
use App\Models\BootcampRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function bootcampOwner(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

function ownedBootcamp(User $owner, array $overrides = []): Bootcamp
{
    return Bootcamp::factory()->create(array_merge([
        'instructor_id' => $owner->id,
    ], $overrides));
}

function bootcampPayload(array $overrides = []): array
{
    return array_merge([
        'title' => 'EV & Hybrid Diagnostics Bootcamp',
        'slug' => 'ev-hybrid-'.Str::lower(Str::random(8)),
        'short_description' => 'Diagnose high-voltage systems safely.',
        'description' => 'A hands-on bootcamp covering safety, batteries and live vehicles.',
        'duration_value' => 4,
        'duration_unit' => 'weeks',
        'location' => 'Algiers · Hydra Campus',
        'price' => 89000,
        'currency' => 'DZD',
        'level' => 'intermediate',
        'includes' => [
            'challenges' => true,
            'resources' => true,
            'quizzes' => true,
            'support' => true,
            'certificate' => true,
            'final_project' => true,
            'classrooms' => true,
        ],
    ], $overrides);
}

it('lets an instructor create, update, publish and unpublish a bootcamp', function () {
    $instructor = bootcampOwner();

    $create = $this->actingAs($instructor)
        ->postJson('/api/v1/instructor/bootcamps', bootcampPayload())
        ->assertCreated()
        ->assertJsonPath('data.status', BootcampStatus::DRAFT->value)
        ->assertJsonPath('data.includes.challenges', true)
        ->assertJsonPath('data.includes.certificate', true)
        ->assertJsonPath('data.includes.final_project', true)
        ->assertJsonPath('data.includes.classrooms', true);

    $bootcampId = $create->json('data.id');

    $this->assertDatabaseHas('bootcamps', [
        'id' => $bootcampId,
        'instructor_id' => $instructor->id,
        'status' => 'draft',
    ]);

    $this->actingAs($instructor)
        ->patchJson("/api/v1/instructor/bootcamps/{$bootcampId}", [
            'title' => 'EV & Hybrid Diagnostics — Updated',
            'price' => 95000,
            'includes' => ['support' => false],
        ])
        ->assertOk()
        ->assertJsonPath('data.title', 'EV & Hybrid Diagnostics — Updated')
        ->assertJsonPath('data.price', 95000)
        ->assertJsonPath('data.includes.challenges', true)
        ->assertJsonPath('data.includes.support', false);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcampId}/publish")
        ->assertOk()
        ->assertJsonPath('data.status', BootcampStatus::PUBLISHED->value);

    $this->assertDatabaseHas('bootcamps', [
        'id' => $bootcampId,
        'status' => 'published',
    ]);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcampId}/unpublish")
        ->assertOk()
        ->assertJsonPath('data.status', BootcampStatus::DRAFT->value)
        ->assertJsonPath('data.published_at', null);
});

it('marks a bootcamp as published and visible in the public catalog', function () {
    $instructor = bootcampOwner();

    $bootcamp = $this->actingAs($instructor)
        ->postJson('/api/v1/instructor/bootcamps', bootcampPayload())
        ->assertCreated()
        ->json('data');

    $this->getJson('/api/v1/catalog/bootcamps')
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp['id']}/publish")
        ->assertOk();

    $this->getJson('/api/v1/catalog/bootcamps')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $bootcamp['id']);
});

it('only lists and allows management of the instructor own bootcamps', function () {
    $owner = bootcampOwner();
    $other = bootcampOwner();

    $owned = ownedBootcamp($owner);
    $foreign = ownedBootcamp($other, [
        'status' => BootcampStatus::PUBLISHED,
        'published_at' => now(),
    ]);

    $this->actingAs($owner)
        ->getJson('/api/v1/instructor/bootcamps')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $owned->id);

    $this->actingAs($owner)
        ->getJson("/api/v1/instructor/bootcamps/{$foreign->id}")
        ->assertForbidden();

    $this->actingAs($owner)
        ->patchJson("/api/v1/instructor/bootcamps/{$foreign->id}", [
            'title' => 'Hijacked',
        ])
        ->assertForbidden();

    $this->actingAs($owner)
        ->deleteJson("/api/v1/instructor/bootcamps/{$foreign->id}")
        ->assertForbidden();

    $this->actingAs($owner)
        ->getJson("/api/v1/instructor/bootcamps/{$foreign->id}/registrations")
        ->assertForbidden();
});

it('validates bootcamp duration, level and commerce fields', function () {
    $instructor = bootcampOwner();

    $this->actingAs($instructor)
        ->postJson('/api/v1/instructor/bootcamps', bootcampPayload([
            'duration_unit' => 'months',
            'level' => 'expert',
            'price' => -1,
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'duration_unit',
            'level',
            'price',
        ]);

    $this->actingAs($instructor)
        ->postJson('/api/v1/instructor/bootcamps', bootcampPayload([
            'description' => '',
            'location' => '',
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['description', 'location']);
});

it('syncs the bootcamp curriculum and removes omitted sections and lessons', function () {
    $instructor = bootcampOwner();
    $bootcamp = ownedBootcamp($instructor);

    $response = $this->actingAs($instructor)
        ->putJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/curriculum", [
            'sections' => [
                [
                    'title' => 'High-voltage safety',
                    'lessons' => [
                        [
                            'title' => 'Isolation procedures',
                            'classroom_count' => 3,
                            'duration_minutes' => 90,
                        ],
                        [
                            'title' => 'PPE and rescue',
                            'classroom_count' => 2,
                            'duration_minutes' => 60,
                        ],
                    ],
                ],
                [
                    'title' => 'Battery systems',
                    'lessons' => [
                        [
                            'title' => 'BMS live data',
                            'classroom_count' => 4,
                            'duration_minutes' => 120,
                        ],
                    ],
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonCount(2, 'data.sections')
        ->assertJsonPath('data.sections.0.position', 1)
        ->assertJsonPath('data.sections.0.lessons.0.classroom_count', 3)
        ->assertJsonPath('data.sections.1.title', 'Battery systems');

    $sections = $response->json('data.sections');
    $firstSection = $sections[0];
    $firstLesson = $firstSection['lessons'][0];

    $this->assertDatabaseCount('bootcamp_sections', 2);
    $this->assertDatabaseCount('bootcamp_lessons', 3);

    $this->actingAs($instructor)
        ->putJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/curriculum", [
            'sections' => [
                [
                    'id' => $firstSection['id'],
                    'title' => 'High-voltage safety — revised',
                    'lessons' => [
                        [
                            'id' => $firstLesson['id'],
                            'title' => 'Isolation procedures — revised',
                            'classroom_count' => 5,
                            'duration_minutes' => 100,
                        ],
                    ],
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonCount(1, 'data.sections')
        ->assertJsonPath('data.sections.0.title', 'High-voltage safety — revised')
        ->assertJsonPath('data.sections.0.lessons.0.title', 'Isolation procedures — revised')
        ->assertJsonPath('data.sections.0.lessons.0.classroom_count', 5);

    $this->assertDatabaseCount('bootcamp_sections', 1);
    $this->assertDatabaseCount('bootcamp_lessons', 1);
});

it('allows the owner to manage schedules and registration status', function () {
    $instructor = bootcampOwner();
    $bootcamp = ownedBootcamp($instructor);

    $scheduleResponse = $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/schedules", [
            'starts_at' => today()->addDays(10)->toDateString(),
            'ends_at' => today()->addDays(24)->toDateString(),
        ])
        ->assertCreated();

    $scheduleId = $scheduleResponse->json('data.id');

    $this->actingAs($instructor)
        ->patchJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/schedules/{$scheduleId}", [
            'starts_at' => today()->addDays(12)->toDateString(),
            'ends_at' => today()->addDays(26)->toDateString(),
        ])
        ->assertOk()
        ->assertJsonPath('data.starts_at', today()->addDays(12)->toDateString());

    $registration = BootcampRegistration::factory()->create([
        'bootcamp_id' => $bootcamp->id,
        'bootcamp_schedule_id' => $scheduleId,
        'first_name' => 'Nadia',
        'last_name' => 'Benali',
        'email' => 'nadia@example.com',
    ]);

    $this->actingAs($instructor)
        ->getJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/registrations")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.email', 'nadia@example.com')
        ->assertJsonPath('data.0.schedule.id', $scheduleId);

    $this->actingAs($instructor)
        ->patchJson(
            "/api/v1/instructor/bootcamps/{$bootcamp->id}/registrations/{$registration->id}",
            ['status' => 'confirmed']
        )
        ->assertOk()
        ->assertJsonPath('data.status', 'confirmed');

    $this->actingAs($instructor)
        ->deleteJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/schedules/{$scheduleId}")
        ->assertUnprocessable();

    $registration->delete();

    $this->actingAs($instructor)
        ->deleteJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/schedules/{$scheduleId}")
        ->assertOk();

    $this->assertDatabaseMissing('bootcamp_schedules', ['id' => $scheduleId]);
});

it('validates schedule dates', function () {
    $instructor = bootcampOwner();
    $bootcamp = ownedBootcamp($instructor);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/schedules", [
            'starts_at' => today()->addDays(20)->toDateString(),
            'ends_at' => today()->addDays(10)->toDateString(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('ends_at');
});

it('uploads and replaces a bootcamp brochure PDF', function () {
    Storage::fake('local');

    $instructor = bootcampOwner();
    $bootcamp = ownedBootcamp($instructor);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/brochure", [
            'brochure' => UploadedFile::fake()->create(
                'EV Bootcamp Syllabus.pdf',
                120,
                'application/pdf'
            ),
        ])
        ->assertOk()
        ->assertJsonPath('data.brochure_available', true);

    $bootcamp->refresh();
    $firstPath = $bootcamp->brochure_path;

    $this->assertNotNull($firstPath);
    Storage::disk('local')->assertExists($firstPath);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/brochure", [
            'brochure' => UploadedFile::fake()->create(
                'Updated Syllabus.pdf',
                140,
                'application/pdf'
            ),
        ])
        ->assertOk();

    $bootcamp->refresh();

    expect($bootcamp->brochure_path)->not->toBe($firstPath);
    Storage::disk('local')->assertMissing($firstPath);
    Storage::disk('local')->assertExists($bootcamp->brochure_path);
    expect($bootcamp->brochure_original_name)->toBe('Updated Syllabus.pdf');
});

it('rejects non-PDF brochure uploads', function () {
    Storage::fake('local');

    $instructor = bootcampOwner();
    $bootcamp = ownedBootcamp($instructor);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/brochure", [
            'brochure' => UploadedFile::fake()->create(
                'notes.txt',
                10,
                'text/plain'
            ),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('brochure');
});

it('uploads, replaces and removes bootcamp thumbnail and cover images', function () {
    Storage::fake('public');

    $instructor = bootcampOwner();
    $bootcamp = ownedBootcamp($instructor);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/media/thumbnail", [
            'file' => UploadedFile::fake()->image('thumbnail.jpg', 1280, 720),
        ])
        ->assertOk()
        ->assertJsonPath('data.thumbnail', fn ($value) => is_string($value) && str_contains($value, '/storage/bootcamps/'));

    $bootcamp->refresh();
    $firstThumbnail = $bootcamp->thumbnail;

    expect($firstThumbnail)->not->toBeNull();
    Storage::disk('public')->assertExists($firstThumbnail);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/media/thumbnail", [
            'file' => UploadedFile::fake()->image('thumbnail-new.png', 1280, 720),
        ])
        ->assertOk();

    $bootcamp->refresh();

    expect($bootcamp->thumbnail)->not->toBe($firstThumbnail);
    Storage::disk('public')->assertMissing($firstThumbnail);
    Storage::disk('public')->assertExists($bootcamp->thumbnail);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/media/cover_image", [
            'file' => UploadedFile::fake()->image('cover.jpg', 1920, 1080),
        ])
        ->assertOk()
        ->assertJsonPath('data.cover_image', fn ($value) => is_string($value) && str_contains($value, '/storage/bootcamps/'));

    $bootcamp->refresh();
    $cover = $bootcamp->cover_image;

    Storage::disk('public')->assertExists($cover);

    $this->actingAs($instructor)
        ->deleteJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/media/cover_image")
        ->assertOk()
        ->assertJsonPath('data.cover_image', null);

    $bootcamp->refresh();

    expect($bootcamp->cover_image)->toBeNull();
    Storage::disk('public')->assertMissing($cover);
});

it('accepts a short preview video and rejects unsupported media formats', function () {
    Storage::fake('public');

    $instructor = bootcampOwner();
    $bootcamp = ownedBootcamp($instructor);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/media/preview_video", [
            'file' => UploadedFile::fake()->create(
                'bootcamp-preview.mp4',
                2048,
                'video/mp4'
            ),
        ])
        ->assertOk()
        ->assertJsonPath('data.preview_video', fn ($value) => is_string($value) && str_contains($value, '/storage/bootcamps/'));

    $bootcamp->refresh();
    Storage::disk('public')->assertExists($bootcamp->preview_video);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/media/thumbnail", [
            'file' => UploadedFile::fake()->create(
                'thumbnail.pdf',
                10,
                'application/pdf'
            ),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('file');

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/media/preview_video", [
            'file' => UploadedFile::fake()->create(
                'preview.mov',
                2048,
                'video/quicktime'
            ),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('file');
});

it('forbids another instructor from managing bootcamp media', function () {
    Storage::fake('public');

    $owner = bootcampOwner();
    $other = bootcampOwner();
    $bootcamp = ownedBootcamp($owner);

    $this->actingAs($other)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/media/thumbnail", [
            'file' => UploadedFile::fake()->image('thumbnail.jpg'),
        ])
        ->assertForbidden();
});

it('deletes stored bootcamp media when the bootcamp is removed', function () {
    Storage::fake('public');
    Storage::fake('local');

    $instructor = bootcampOwner();
    $bootcamp = ownedBootcamp($instructor);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/bootcamps/{$bootcamp->id}/media/thumbnail", [
            'file' => UploadedFile::fake()->image('thumbnail.jpg'),
        ])
        ->assertOk();

    $bootcamp->refresh();
    $thumbnail = $bootcamp->thumbnail;

    $this->actingAs($instructor)
        ->deleteJson("/api/v1/instructor/bootcamps/{$bootcamp->id}")
        ->assertOk();

    Storage::disk('public')->assertMissing($thumbnail);
});
