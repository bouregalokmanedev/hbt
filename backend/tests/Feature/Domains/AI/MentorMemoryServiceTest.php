<?php

use App\Domains\AI\Enums\MentorMemoryType;
use App\Domains\AI\Models\MentorMemory;
use App\Domains\AI\Services\MentorMemoryService;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function mentorMemoryService(): MentorMemoryService
{
    return app(MentorMemoryService::class);
}

it('creates a mentor memory', function () {
    $user = User::factory()->create();

    $memory = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::STRENGTH,
        key: 'diagnostic_reasoning',
        value: 'Strong at interpreting sensor data.',
    );

    expect($memory)
        ->toBeInstanceOf(MentorMemory::class)
        ->and($memory->user_id)
        ->toBe($user->id)
        ->and($memory->type)
        ->toBe(MentorMemoryType::STRENGTH)
        ->and($memory->key)
        ->toBe('diagnostic_reasoning')
        ->and($memory->value)
        ->toBe('Strong at interpreting sensor data.')
        ->and($memory->confidence)
        ->toBe(1.0);
});

it('updates an existing memory instead of creating a duplicate', function () {
    $user = User::factory()->create();

    $first = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::KNOWLEDGE,
        key: 'fuel_trim',
        value: 'Understands basic fuel trim.',
        confidence: 0.6,
        source: 'conversation',
    );

    $second = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::KNOWLEDGE,
        key: 'fuel_trim',
        value: 'Understands short and long term fuel trim.',
        confidence: 0.9,
        source: 'assessment',
    );

    expect($second->id)
        ->toBe($first->id);

    expect(MentorMemory::query()
        ->where('user_id', $user->id)
        ->where('type', MentorMemoryType::KNOWLEDGE->value)
        ->where('key', 'fuel_trim')
        ->count()
    )->toBe(1);

    expect($second->value)
        ->toBe('Understands short and long term fuel trim.');

    expect($second->confidence)
        ->toBe(0.9);

    expect($second->source)
        ->toBe('assessment');
});

it('clamps confidence between zero and one', function () {
    $user = User::factory()->create();

    $low = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::WEAKNESS,
        key: 'oscilloscope',
        value: 'Needs more practice.',
        confidence: -2,
    );

    $high = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::STRENGTH,
        key: 'multimeter',
        value: 'Very comfortable using a multimeter.',
        confidence: 4,
    );

    expect($low->confidence)
        ->toBe(0.0);

    expect($high->confidence)
        ->toBe(1.0);
});

it('returns global memories and memories for the requested course', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $globalMemory = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::PREFERENCE,
        key: 'explanation_style',
        value: 'Prefers practical examples.',
    );

    $courseMemory = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::GOAL,
        key: 'course_goal',
        value: 'Master engine diagnostics.',
        courseId: (string) $course->id,
    );

    mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::KNOWLEDGE,
        key: 'other_course',
        value: 'Should not appear here.',
        courseId: (string) Course::factory()->create()->id,
    );

    $memories = mentorMemoryService()->relevantFor(
        user: $user,
        courseId: (string) $course->id,
    );

    expect($memories->pluck('id'))
        ->toContain($globalMemory->id)
        ->toContain($courseMemory->id)
        ->toHaveCount(2);
});

it('returns only global memories when no course is provided', function () {
    $user = User::factory()->create();

    $globalMemory = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::PREFERENCE,
        key: 'learning_style',
        value: 'Prefers visual explanations.',
    );

    mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::GOAL,
        key: 'course_goal',
        value: 'Finish the course.',
        courseId: (string) Course::factory()->create()->id,
    );

    $memories = mentorMemoryService()->relevantFor($user);

    expect($memories)
        ->toHaveCount(1)
        ->and($memories->first()->id)
        ->toBe($globalMemory->id);
});

it('excludes expired memories', function () {
    $user = User::factory()->create();

    $active = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::STRENGTH,
        key: 'diagnostics',
        value: 'Good diagnostic reasoning.',
    );

    $expired = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::WEAKNESS,
        key: 'scope',
        value: 'Needs more practice with scope interpretation.',
    );

    $expired->update([
        'expires_at' => now()->subMinute(),
    ]);

    $memories = mentorMemoryService()->relevantFor($user);

    expect($memories)
        ->toHaveCount(1)
        ->and($memories->first()->id)
        ->toBe($active->id);
});

it('orders relevant memories by confidence and then last used time', function () {
    $user = User::factory()->create();

    $low = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::WEAKNESS,
        key: 'low',
        value: 'Low confidence memory.',
        confidence: 0.4,
    );

    $high = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::STRENGTH,
        key: 'high',
        value: 'High confidence memory.',
        confidence: 0.9,
    );

    $medium = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::KNOWLEDGE,
        key: 'medium',
        value: 'Medium confidence memory.',
        confidence: 0.7,
    );

    $memories = mentorMemoryService()->relevantFor($user);

    expect($memories->pluck('id')->values()->all())
        ->toBe([
            $high->id,
            $medium->id,
            $low->id,
        ]);
});

it('respects the requested memory limit', function () {
    $user = User::factory()->create();

    foreach (range(1, 5) as $index) {
        mentorMemoryService()->remember(
            user: $user,
            type: MentorMemoryType::KNOWLEDGE,
            key: "knowledge_{$index}",
            value: "Knowledge item {$index}.",
            confidence: $index / 5,
        );
    }

    $memories = mentorMemoryService()->relevantFor(
        user: $user,
        limit: 3,
    );

    expect($memories)
        ->toHaveCount(3);
});

it('updates last used time when memories are marked as used', function () {
    $user = User::factory()->create();

    $memory = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::KNOWLEDGE,
        key: 'fuel_trim',
        value: 'Understands fuel trim.',
    );

    $oldTime = now()->subHour();

    $memory->update([
        'last_used_at' => $oldTime,
    ]);

    $memories = collect([$memory->fresh()]);

    mentorMemoryService()->markUsed($memories);

    $updated = $memory->fresh();

    expect($updated->last_used_at)
        ->not->toBeNull()
        ->and($updated->last_used_at->greaterThan($oldTime))
        ->toBeTrue();
});

it('does nothing when marking an empty memory collection as used', function () {
    expect(fn () => mentorMemoryService()->markUsed(collect()))
        ->not->toThrow(Throwable::class);
});

it('forgets a mentor memory', function () {
    $user = User::factory()->create();

    $memory = mentorMemoryService()->remember(
        user: $user,
        type: MentorMemoryType::GOAL,
        key: 'certification',
        value: 'Complete HBT-CD Level 2.',
    );

    expect(MentorMemory::query()
        ->whereKey($memory->id)
        ->exists()
    )->toBeTrue();

    mentorMemoryService()->forget($memory);

    expect(MentorMemory::query()
        ->whereKey($memory->id)
        ->exists()
    )->toBeFalse();
});