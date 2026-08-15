<?php

use App\Domains\Courses\Repositories\EloquentSectionProgressRepository;
use App\Domains\Courses\Repositories\SectionProgressRepositoryInterface;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Eloquent\ModelNotFoundException;

uses(RefreshDatabase::class);

it('resolves the repository through its interface', function () {
    expect(app(SectionProgressRepositoryInterface::class))
        ->toBeInstanceOf(EloquentSectionProgressRepository::class);
});

it('finds progress by user and section', function () {
    $user = User::factory()->create();
    $section = Section::factory()->create();

    $progress = SectionProgress::factory()->create([
        'user_id' => $user->id,
        'section_id' => $section->id,
    ]);

    $result = app(SectionProgressRepositoryInterface::class)
        ->findByUserAndSection(
            $user->id,
            $section->id
        );

    expect($result)
        ->not->toBeNull()
        ->and($result->is($progress))
        ->toBeTrue();
});

it('returns null when progress does not exist', function () {
    $user = User::factory()->create();
    $section = Section::factory()->create();

    $result = app(SectionProgressRepositoryInterface::class)
        ->findByUserAndSection(
            $user->id,
            $section->id
        );

    expect($result)->toBeNull();
});

it('does not return another users progress', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $section = Section::factory()->create();

    SectionProgress::factory()->create([
        'user_id' => $otherUser->id,
        'section_id' => $section->id,
    ]);

    $result = app(SectionProgressRepositoryInterface::class)
        ->findByUserAndSection(
            $user->id,
            $section->id
        );

    expect($result)->toBeNull();
});

it('does not return progress for another section', function () {
    $user = User::factory()->create();
    $section = Section::factory()->create();
    $otherSection = Section::factory()->create();

    SectionProgress::factory()->create([
        'user_id' => $user->id,
        'section_id' => $otherSection->id,
    ]);

    $result = app(SectionProgressRepositoryInterface::class)
        ->findByUserAndSection(
            $user->id,
            $section->id
        );

    expect($result)->toBeNull();
});

it('creates section progress', function () {
    $user = User::factory()->create();
    $section = Section::factory()->create();

    $progress = app(SectionProgressRepositoryInterface::class)
        ->create([
            'user_id' => $user->id,
            'section_id' => $section->id,
            'progress_percentage' => 40,
            'time_spent' => 180,
        ]);

    expect($progress)
        ->toBeInstanceOf(SectionProgress::class)
        ->and($progress->user_id)
        ->toBe($user->id)
        ->and($progress->section_id)
        ->toBe($section->id)
        ->and($progress->progress_percentage)
        ->toBe(40)
        ->and($progress->time_spent)
        ->toBe(180);
});

it('updates section progress', function () {
    $progress = SectionProgress::factory()->create([
        'progress_percentage' => 20,
        'time_spent' => 100,
    ]);

    $result = app(SectionProgressRepositoryInterface::class)
        ->update($progress, [
            'progress_percentage' => 65,
            'time_spent' => 300,
        ]);

    expect($result->progress_percentage)
        ->toBe(65)
        ->and($result->time_spent)
        ->toBe(300);
});

it('returns the refreshed model after updating', function () {
    $progress = SectionProgress::factory()->create([
        'progress_percentage' => 20,
    ]);

    $result = app(SectionProgressRepositoryInterface::class)
        ->update($progress, [
            'progress_percentage' => 75,
        ]);

    $fresh = SectionProgress::query()->findOrFail($progress->id);

    expect($result->is($fresh))
        ->toBeTrue()
        ->and($result->progress_percentage)
        ->toBe(75);
});

it('finds progress by id', function () {
    $progress = SectionProgress::factory()->create();

    $result = app(SectionProgressRepositoryInterface::class)
        ->find($progress->id);

    expect($result)
        ->not->toBeNull()
        ->and($result->is($progress))
        ->toBeTrue();
});

it('returns null when progress id does not exist', function () {
    $result = app(SectionProgressRepositoryInterface::class)
        ->find('00000000-0000-0000-0000-000000000000');

    expect($result)->toBeNull();
});

it('finds progress or fails by id', function () {
    $progress = SectionProgress::factory()->create();

    $result = app(SectionProgressRepositoryInterface::class)
        ->findOrFail($progress->id);

    expect($result->is($progress))
        ->toBeTrue();
});

it('throws when finding an unknown progress id', function () {
    expect(fn () => app(SectionProgressRepositoryInterface::class)
        ->findOrFail('00000000-0000-0000-0000-000000000000'))
        ->toThrow(ModelNotFoundException::class);
});

it('finds all progress for a user', function () {
    $user = User::factory()->create();

    $firstSection = Section::factory()->create();
    $secondSection = Section::factory()->create();

    $first = SectionProgress::factory()->create([
        'user_id' => $user->id,
        'section_id' => $firstSection->id,
    ]);

    $second = SectionProgress::factory()->create([
        'user_id' => $user->id,
        'section_id' => $secondSection->id,
    ]);

    SectionProgress::factory()->create();

    $result = app(SectionProgressRepositoryInterface::class)
        ->findByUser($user->id);

    expect($result)
        ->toHaveCount(2)
        ->and($result->pluck('id'))
        ->toContain($first->id)
        ->toContain($second->id);
});

it('finds all progress for a section', function () {
    $section = Section::factory()->create();

    $firstUser = User::factory()->create();
    $secondUser = User::factory()->create();

    $first = SectionProgress::factory()->create([
        'user_id' => $firstUser->id,
        'section_id' => $section->id,
    ]);

    $second = SectionProgress::factory()->create([
        'user_id' => $secondUser->id,
        'section_id' => $section->id,
    ]);

    SectionProgress::factory()->create();

    $result = app(SectionProgressRepositoryInterface::class)
        ->findBySection($section->id);

    expect($result)
        ->toHaveCount(2)
        ->and($result->pluck('id'))
        ->toContain($first->id)
        ->toContain($second->id);
});