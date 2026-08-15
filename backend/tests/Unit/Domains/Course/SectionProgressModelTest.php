<?php

use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates section progress', function () {
    $progress = SectionProgress::factory()->create();

    expect($progress->id)
        ->not->toBeNull()
        ->and($progress->user_id)
        ->not->toBeNull()
        ->and($progress->section_id)
        ->not->toBeNull()
        ->and($progress->progress_percentage)
        ->toBe(0)
        ->and($progress->time_spent)
        ->toBe(0);
});

it('uses a uuid as its primary key', function () {
    $progress = SectionProgress::factory()->create();

    expect($progress->id)
        ->toBeString()
        ->and(strlen($progress->id))
        ->toBe(36);
});

it('belongs to a user', function () {
    $user = User::factory()->create();

    $progress = SectionProgress::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($progress->user->is($user))
        ->toBeTrue();
});

it('belongs to a section', function () {
    $section = Section::factory()->create();

    $progress = SectionProgress::factory()->create([
        'section_id' => $section->id,
    ]);

    expect($progress->section->is($section))
        ->toBeTrue();
});

it('casts progress fields correctly', function () {
    $progress = SectionProgress::factory()->create([
        'progress_percentage' => 65,
        'time_spent' => 420,
        'started_at' => now(),
        'completed_at' => now(),
    ]);

    expect($progress->progress_percentage)
        ->toBeInt()
        ->toBe(65)
        ->and($progress->time_spent)
        ->toBeInt()
        ->toBe(420)
        ->and($progress->started_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class)
        ->and($progress->completed_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});

it('allows incomplete section progress', function () {
    $progress = SectionProgress::factory()->create();

    expect($progress->completed_at)
        ->toBeNull();
});

it('allows completed section progress', function () {
    $progress = SectionProgress::factory()->create([
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    expect($progress->progress_percentage)
        ->toBe(100)
        ->and($progress->completed_at)
        ->not->toBeNull();
});

it('does not allow duplicate progress for the same user and section', function () {
    $user = User::factory()->create();
    $section = Section::factory()->create();

    SectionProgress::factory()->create([
        'user_id' => $user->id,
        'section_id' => $section->id,
    ]);

    expect(fn () => SectionProgress::factory()->create([
        'user_id' => $user->id,
        'section_id' => $section->id,
    ]))->toThrow(QueryException::class);
});