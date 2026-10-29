<?php

namespace Tests\Feature\Domains\Bootcamp;

use App\Enums\Bootcamps\BootcampStatus;
use App\Models\Bootcamp;
use Database\Seeders\ExampleBootcampsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('seeds two complete published bootcamps idempotently', function () {
    Storage::fake('local');
    Storage::fake('public');

    $this->seed(ExampleBootcampsSeeder::class);

    expect(Bootcamp::query()->count())->toBe(2);

    $bootcamps = Bootcamp::query()
        ->with(['schedules', 'sections.lessons', 'registrations'])
        ->get();

    foreach ($bootcamps as $bootcamp) {
        expect($bootcamp->status)->toBe(BootcampStatus::PUBLISHED)
            ->and($bootcamp->published_at)->not->toBeNull()
            ->and($bootcamp->schedules)->not->toBeEmpty()
            ->and($bootcamp->sections)->not->toBeEmpty()
            ->and($bootcamp->sections->first()->lessons)->not->toBeEmpty()
            ->and($bootcamp->registrations)->not->toBeEmpty()
            ->and($bootcamp->brochure_path)->not->toBeNull()
            ->and($bootcamp->normalisedIncludes())->toHaveKey('certificate')
            ->and($bootcamp->normalisedIncludes()['final_project'])->toBeTrue()
            ->and($bootcamp->normalisedIncludes()['classrooms'])->toBeTrue()
            ->and($bootcamp->thumbnail)->not->toBeNull()
            ->and($bootcamp->cover_image)->not->toBeNull();

        Storage::disk('public')->assertExists($bootcamp->thumbnail);
        Storage::disk('public')->assertExists($bootcamp->cover_image);
    }

    $this->seed(ExampleBootcampsSeeder::class);

    expect(Bootcamp::query()->count())->toBe(2);
});
