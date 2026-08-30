<?php

use App\Domains\AI\Enums\MentorMemoryType;
use App\Domains\AI\Models\MentorMemory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates a mentor memory', function () {
    $user = User::factory()->create();

    $memory = MentorMemory::factory()->create([
        'user_id' => $user->id,
        'type' => MentorMemoryType::PREFERENCE,
        'key' => 'learning_style',
        'value' => 'Prefers practical examples.',
    ]);

    expect($memory)
        ->toBeInstanceOf(MentorMemory::class)
        ->and($memory->user_id)
        ->toBe($user->id)
        ->and($memory->key)
        ->toBe('learning_style')
        ->and($memory->value)
        ->toBe('Prefers practical examples.');
});

it('casts the memory type to MentorMemoryType', function () {
    $memory = MentorMemory::factory()->create([
        'type' => MentorMemoryType::STRENGTH,
    ]);

    expect($memory->type)
        ->toBe(MentorMemoryType::STRENGTH);
});

it('casts confidence to float', function () {
    $memory = MentorMemory::factory()->create([
        'confidence' => '0.8500',
    ]);

    expect($memory->confidence)
        ->toBeFloat()
        ->toBe(0.85);
});

it('casts last used and expiration timestamps to dates', function () {
    $memory = MentorMemory::factory()->create([
        'last_used_at' => now(),
        'expires_at' => now()->addDay(),
    ]);

    expect($memory->last_used_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class);

    expect($memory->expires_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});

it('belongs to a user', function () {
    $user = User::factory()->create();

    $memory = MentorMemory::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($memory->user)
        ->toBeInstanceOf(User::class)
        ->and($memory->user->id)
        ->toBe($user->id);
});

it('allows course specific memories to be stored', function () {
    $user = User::factory()->create();

    $courseId = fake()->uuid();

    $memory = MentorMemory::factory()->create([
        'user_id' => $user->id,
        'course_id' => $courseId,
    ]);

    expect($memory->course_id)
        ->toBe($courseId);
});

it('allows global memories without a course', function () {
    $memory = MentorMemory::factory()->create([
        'course_id' => null,
    ]);

    expect($memory->course_id)
        ->toBeNull();
});