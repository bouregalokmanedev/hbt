<?php

use App\Domains\Taxonomy\Events\CategoryUpdated;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();

    Role::firstOrCreate([
        'name' => 'Admin',
        'guard_name' => 'web',
    ]);

    $this->user->assignRole('Admin');

    $this->actingAs($this->user);
});

it('updates a category name', function () {

    Event::fake();

    $category = Category::factory()->create([
        'name' => 'Programming',
        'slug' => 'programming',
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$category->id}",
        [
            'name' => 'Software Development',
            'slug' => 'software-development',
        ]
    );

    $response
        ->assertOk();

    $this->assertDatabaseHas(
        'categories',
        [
            'id' => $category->id,
            'name' => 'Software Development',
            'slug' => 'software-development',
        ]
    );

    Event::assertDispatched(
        CategoryUpdated::class
    );
});


it('updates a category description', function () {

    $category = Category::factory()->create([
        'description' => 'Old description',
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$category->id}",
        [
            'description' => 'New description',
        ]
    );

    $response
        ->assertOk();

    expect(
        $category->fresh()->description
    )->toBe('New description');
});


it('allows moving a category to another valid parent', function () {

    $oldParent = Category::factory()->create();

    $newParent = Category::factory()->create();

    $category = Category::factory()->create([
        'parent_id' => $oldParent->id,
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$category->id}",
        [
            'parent_id' => $newParent->id,
        ]
    );

    $response
        ->assertOk();

    expect(
        $category->fresh()->parent_id
    )->toBe($newParent->id);
});


it('allows moving a category to the root', function () {

    $parent = Category::factory()->create();

    $category = Category::factory()->create([
        'parent_id' => $parent->id,
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$category->id}",
        [
            'parent_id' => null,
        ]
    );

    $response
        ->assertOk();

    expect(
        $category->fresh()->parent_id
    )->toBeNull();
});


it('rejects self-parenting', function () {

    $category = Category::factory()->create();

    $response = $this->putJson(
        "/api/v1/categories/{$category->id}",
        [
            'parent_id' => $category->id,
        ]
    );

    $response
        ->assertUnprocessable();

    expect(
        $category->fresh()->parent_id
    )->toBeNull();
});


it('rejects a direct circular hierarchy', function () {

    $parent = Category::factory()->create();

    $child = Category::factory()->create([
        'parent_id' => $parent->id,
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$parent->id}",
        [
            'parent_id' => $child->id,
        ]
    );

    $response
        ->assertUnprocessable();

    expect(
        $parent->fresh()->parent_id
    )->toBeNull();

    expect(
        $child->fresh()->parent_id
    )->toBe($parent->id);
});


it('rejects an indirect circular hierarchy', function () {

    $a = Category::factory()->create();

    $b = Category::factory()->create([
        'parent_id' => $a->id,
    ]);

    $c = Category::factory()->create([
        'parent_id' => $b->id,
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$a->id}",
        [
            'parent_id' => $c->id,
        ]
    );

    $response
        ->assertUnprocessable();

    expect(
        $a->fresh()->parent_id
    )->toBeNull();

    expect(
        $b->fresh()->parent_id
    )->toBe($a->id);

    expect(
        $c->fresh()->parent_id
    )->toBe($b->id);
});


it('rejects an inactive parent', function () {

    $inactiveParent = Category::factory()->create([
        'is_active' => false,
    ]);

    $category = Category::factory()->create();

    $response = $this->putJson(
        "/api/v1/categories/{$category->id}",
        [
            'parent_id' => $inactiveParent->id,
        ]
    );

    $response
        ->assertUnprocessable();

    expect(
        $category->fresh()->parent_id
    )->toBeNull();
});


it('returns not found for an unknown category', function () {

    $response = $this->putJson(
        '/api/v1/categories/' . fake()->uuid(),
        [
            'name' => 'Programming',
        ]
    );

    $response
        ->assertNotFound();
});