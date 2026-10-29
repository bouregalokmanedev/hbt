<?php

namespace Tests\Feature\Domains\Bootcamp;

use App\Enums\Bootcamps\BootcampRegistrationStatus;
use App\Enums\Bootcamps\BootcampStatus;
use App\Models\Bootcamp;
use App\Models\BootcampRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function bootcampInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

function publishedBootcamp(array $overrides = []): Bootcamp
{
    return Bootcamp::factory()->published()->create(array_merge([
        'instructor_id' => bootcampInstructor()->id,
    ], $overrides));
}

it('lists published bootcamps and applies catalog filters', function () {
    $published = publishedBootcamp([
        'title' => 'EV & Hybrid Diagnostics',
        'location' => 'Algiers · Hydra Campus',
        'level' => 'intermediate',
    ]);
    $published->schedules()->create([
        'starts_at' => today()->addDays(10)->toDateString(),
        'ends_at' => today()->addDays(24)->toDateString(),
    ]);

    Bootcamp::factory()->create([
        'instructor_id' => bootcampInstructor()->id,
        'title' => 'Hidden Draft Bootcamp',
    ]);

    $this->getJson('/api/v1/catalog/bootcamps')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $published->id)
        ->assertJsonPath('data.0.includes.challenges', true)
        ->assertJsonPath('data.0.schedules.0.is_available', true);

    $this->getJson('/api/v1/catalog/bootcamps?search=Hybrid')
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->getJson('/api/v1/catalog/bootcamps?search=Nothing')
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->getJson('/api/v1/catalog/bootcamps?level=advanced')
        ->assertOk()
        ->assertJsonCount(0, 'data');

    $this->getJson('/api/v1/catalog/bootcamps?location=Hydra')
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->getJson('/api/v1/catalog/bootcamps?level=expert')
        ->assertUnprocessable();
});

it('returns every authored detail for a published bootcamp and hides drafts', function () {
    $bootcamp = publishedBootcamp([
        'title' => 'Advanced ECU & CAN Bus Mastery',
        'description' => 'Network diagnostics from first principles.',
        'duration_value' => 10,
        'duration_unit' => 'days',
        'price' => 119000,
        'level' => 'advanced',
        'includes' => [
            'challenges' => true,
            'resources' => true,
            'quizzes' => false,
            'support' => true,
            'certificate' => true,
            'final_project' => true,
            'classrooms' => true,
        ],
        'thumbnail' => 'bootcamps/ecu/thumbnail.jpg',
        'cover_image' => 'bootcamps/ecu/cover.jpg',
        'preview_video' => 'bootcamps/ecu/preview.mp4',
    ]);

    $bootcamp->schedules()->create([
        'starts_at' => today()->addDays(21)->toDateString(),
        'ends_at' => today()->addDays(31)->toDateString(),
    ]);

    $section = $bootcamp->sections()->create([
        'title' => 'Network topology',
        'position' => 1,
    ]);
    $section->lessons()->create([
        'title' => 'CAN fundamentals',
        'classroom_count' => 3,
        'duration_minutes' => 90,
        'position' => 1,
    ]);

    BootcampRegistration::factory()->create([
        'bootcamp_id' => $bootcamp->id,
        'bootcamp_schedule_id' => $bootcamp->schedules()->first()->id,
    ]);

    $this->getJson("/api/v1/catalog/bootcamps/{$bootcamp->id}")
        ->assertOk()
        ->assertJsonPath('data.title', 'Advanced ECU & CAN Bus Mastery')
        ->assertJsonPath('data.duration_value', 10)
        ->assertJsonPath('data.duration_unit', 'days')
        ->assertJsonPath('data.level', 'advanced')
        ->assertJsonPath('data.price', 119000)
        ->assertJsonPath('data.includes.quizzes', false)
        ->assertJsonPath('data.includes.certificate', true)
        ->assertJsonPath('data.includes.final_project', true)
        ->assertJsonPath('data.includes.classrooms', true)
        ->assertJsonPath('data.thumbnail', fn ($value) => is_string($value) && str_ends_with($value, '/storage/bootcamps/ecu/thumbnail.jpg'))
        ->assertJsonPath('data.cover_image', fn ($value) => is_string($value) && str_ends_with($value, '/storage/bootcamps/ecu/cover.jpg'))
        ->assertJsonPath('data.preview_video', fn ($value) => is_string($value) && str_ends_with($value, '/storage/bootcamps/ecu/preview.mp4'))
        ->assertJsonCount(1, 'data.schedules')
        ->assertJsonPath('data.sections.0.title', 'Network topology')
        ->assertJsonPath('data.sections.0.lessons.0.classroom_count', 3)
        ->assertJsonPath('data.registered_count', 1);

    $draft = Bootcamp::factory()->create([
        'instructor_id' => bootcampInstructor()->id,
        'status' => BootcampStatus::DRAFT,
    ]);

    $this->getJson("/api/v1/catalog/bootcamps/{$draft->id}")
        ->assertNotFound();
});

it('returns a calendar of upcoming published sessions', function () {
    $published = publishedBootcamp();
    $published->schedules()->create([
        'starts_at' => today()->addDays(12)->toDateString(),
        'ends_at' => today()->addDays(26)->toDateString(),
    ]);
    $published->schedules()->create([
        'starts_at' => today()->subDays(20)->toDateString(),
        'ends_at' => today()->subDays(2)->toDateString(),
    ]);

    $draft = Bootcamp::factory()->create([
        'instructor_id' => bootcampInstructor()->id,
        'status' => BootcampStatus::DRAFT,
    ]);
    $draft->schedules()->create([
        'starts_at' => today()->addDays(4)->toDateString(),
        'ends_at' => today()->addDays(8)->toDateString(),
    ]);

    $this->getJson('/api/v1/catalog/bootcamps/calendar')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.bootcamp.id', $published->id)
        ->assertJsonPath('data.0.starts_at', today()->addDays(12)->toDateString());
});

it('registers a student for a valid session and rejects invalid submissions', function () {
    $bootcamp = publishedBootcamp();
    $schedule = $bootcamp->schedules()->create([
        'starts_at' => today()->addDays(10)->toDateString(),
        'ends_at' => today()->addDays(24)->toDateString(),
    ]);

    $payload = [
        'first_name' => 'Nadia',
        'last_name' => 'Benali',
        'email' => 'NADIA@example.com',
        'phone' => '+213 555 120 330',
        'schedule_id' => $schedule->id,
        'site' => 'algiers_hydra',
        'payment_method' => 'bank_transfer',
        'terms_accepted' => true,
    ];

    $this->postJson("/api/v1/bootcamps/{$bootcamp->id}/registrations", $payload)
        ->assertCreated()
        ->assertJsonPath('data.email', 'nadia@example.com')
        ->assertJsonPath('data.status', BootcampRegistrationStatus::PENDING->value)
        ->assertJsonPath('data.schedule.id', $schedule->id);

    $this->assertDatabaseHas('bootcamp_registrations', [
        'bootcamp_id' => $bootcamp->id,
        'bootcamp_schedule_id' => $schedule->id,
        'email' => 'nadia@example.com',
        'status' => 'pending',
    ]);

    $this->postJson("/api/v1/bootcamps/{$bootcamp->id}/registrations", $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    $this->postJson(
        "/api/v1/bootcamps/{$bootcamp->id}/registrations",
        array_merge($payload, [
            'email' => 'other@example.com',
            'terms_accepted' => false,
        ])
    )
        ->assertUnprocessable()
        ->assertJsonValidationErrors('terms_accepted');

    $other = publishedBootcamp();
    $otherSchedule = $other->schedules()->create([
        'starts_at' => today()->addDays(10)->toDateString(),
        'ends_at' => today()->addDays(24)->toDateString(),
    ]);

    $this->postJson(
        "/api/v1/bootcamps/{$bootcamp->id}/registrations",
        array_merge($payload, [
            'email' => 'other@example.com',
            'schedule_id' => $otherSchedule->id,
        ])
    )
        ->assertUnprocessable()
        ->assertJsonValidationErrors('schedule_id');
});

it('rejects registrations for sessions that have already ended', function () {
    $bootcamp = publishedBootcamp();
    $schedule = $bootcamp->schedules()->create([
        'starts_at' => today()->subDays(20)->toDateString(),
        'ends_at' => today()->subDays(2)->toDateString(),
    ]);

    $this->postJson("/api/v1/bootcamps/{$bootcamp->id}/registrations", [
        'first_name' => 'Sara',
        'last_name' => 'Haddad',
        'email' => 'sara@example.com',
        'phone' => '+213 555 000 111',
        'schedule_id' => $schedule->id,
        'site' => 'online',
        'payment_method' => 'visa_card',
        'terms_accepted' => true,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('schedule_id');
});

it('downloads the brochure of a published bootcamp', function () {
    Storage::fake('local');

    $bootcamp = publishedBootcamp([
        'brochure_path' => 'bootcamp-brochures/guide.pdf',
        'brochure_original_name' => 'Bootcamp-Guide.pdf',
    ]);

    Storage::disk('local')->put(
        'bootcamp-brochures/guide.pdf',
        '%PDF-1.4 sample'
    );

    $this->get("/api/v1/bootcamps/{$bootcamp->id}/brochure")
        ->assertOk()
        ->assertDownload('Bootcamp-Guide.pdf');
});
