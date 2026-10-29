<?php

use App\Domains\Taxonomy\Events\CategoryAttachedToCourse;
use App\Domains\Taxonomy\Events\CategoryCreated;
use App\Domains\Taxonomy\Events\CategoryDeleted;
use App\Domains\Taxonomy\Events\CategoryUpdated;
use App\Domains\Taxonomy\Services\CategoryCacheService;
use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

uses(RefreshDatabase::class);

/**
 * Laravel only reads a $listen property from EventServiceProvider. These
 * listeners used to live on AppServiceProvider, so audits and cache
 * invalidation never ran. Keep a behavioural guard so they stay wired.
 */
function seedCategoryCaches(): void
{
    foreach ([
        CategoryCacheService::TREE_KEY,
        CategoryCacheService::ROOTS_KEY,
        CategoryCacheService::ACTIVE_KEY,
        CategoryCacheService::INACTIVE_KEY,
        CategoryCacheService::LEAVES_KEY,
    ] as $key) {
        Cache::put($key, 'stale', 60);
    }
}

function expectCategoryCachesCleared(): void
{
    foreach ([
        CategoryCacheService::TREE_KEY,
        CategoryCacheService::ROOTS_KEY,
        CategoryCacheService::ACTIVE_KEY,
        CategoryCacheService::INACTIVE_KEY,
        CategoryCacheService::LEAVES_KEY,
    ] as $key) {
        expect(Cache::has($key))->toBeFalse();
    }
}

it('records category audit events and clears caches on create/update/delete', function () {
    $actor = User::factory()->create();
    $this->actingAs($actor);

    $category = Category::factory()->create();

    seedCategoryCaches();
    event(new CategoryCreated($category, $actor->id));

    expectCategoryCachesCleared();
    $this->assertDatabaseHas('audit_logs', [
        'event' => 'category.created',
        'auditable_id' => (string) $category->id,
        'user_id' => $actor->id,
    ]);

    seedCategoryCaches();
    event(new CategoryUpdated($category, ['name' => 'Updated'], $actor->id));

    expectCategoryCachesCleared();
    $this->assertDatabaseHas('audit_logs', [
        'event' => 'category.updated',
        'auditable_id' => (string) $category->id,
    ]);

    seedCategoryCaches();
    event(new CategoryDeleted($category));

    expectCategoryCachesCleared();
    $this->assertDatabaseHas('audit_logs', [
        'event' => 'category.deleted',
        'auditable_id' => (string) $category->id,
    ]);
});

it('records attach/detach audits and clears caches', function () {
    $actor = User::factory()->create();
    $this->actingAs($actor);

    $category = Category::factory()->create();
    $course = Course::factory()->create();

    seedCategoryCaches();
    event(new CategoryAttachedToCourse($course, $category, $actor->id));

    expectCategoryCachesCleared();
    $this->assertDatabaseHas('audit_logs', [
        'event' => 'category.attached_to_course',
        'auditable_id' => (string) $category->id,
        'user_id' => $actor->id,
    ]);

    seedCategoryCaches();
    event(new \App\Domains\Taxonomy\Events\CategoryDetachedFromCourse($category, $course, $actor->id));

    expectCategoryCachesCleared();
    $this->assertDatabaseHas('audit_logs', [
        'event' => 'category.detached_from_course',
        'auditable_id' => (string) $category->id,
    ]);
});
