<?php

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();

    Role::firstOrCreate([
        'name' => 'Admin',
        'guard_name' => 'web',
    ]);

    $this->user->assignRole('Admin');

    Sanctum::actingAs($this->user);
});

it('cannot make a category its own parent', function () {

    $category = Category::factory()->create();

    $response = $this->putJson(
        "/api/v1/categories/{$category->id}",
        [
            'parent_id' => $category->id,
        ]
    );

    $response->assertUnprocessable();

    expect(
        $category->fresh()->parent_id
    )->toBeNull();
});

it('cannot create a direct circular hierarchy', function () {

    $parent = Category::factory()->create([
        'name' => 'Programming',
        'slug' => 'programming',
    ]);

    $child = Category::factory()->create([
        'name' => 'Backend',
        'slug' => 'backend',
        'parent_id' => $parent->id,
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$parent->id}",
        [
            'parent_id' => $child->id,
        ]
    );

    $response->assertUnprocessable();

    expect(
        $parent->fresh()->parent_id
    )->toBeNull();

    expect(
        $child->fresh()->parent_id
    )->toBe($parent->id);
});

it('cannot create an indirect circular hierarchy', function () {

    $programming = Category::factory()->create([
        'name' => 'Programming',
        'slug' => 'programming',
    ]);

    $backend = Category::factory()->create([
        'name' => 'Backend',
        'slug' => 'backend',
        'parent_id' => $programming->id,
    ]);

    $php = Category::factory()->create([
        'name' => 'PHP',
        'slug' => 'php',
        'parent_id' => $backend->id,
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$programming->id}",
        [
            'parent_id' => $php->id,
        ]
    );

    $response->assertUnprocessable();

    expect(
        $programming->fresh()->parent_id
    )->toBeNull();

    expect(
        $backend->fresh()->parent_id
    )->toBe($programming->id);

    expect(
        $php->fresh()->parent_id
    )->toBe($backend->id);
});

it('allows moving a category to a valid parent', function () {

    $programming = Category::factory()->create([
        'name' => 'Programming',
        'slug' => 'programming',
    ]);

    $design = Category::factory()->create([
        'name' => 'Design',
        'slug' => 'design',
    ]);

    $backend = Category::factory()->create([
        'name' => 'Backend',
        'slug' => 'backend',
        'parent_id' => $programming->id,
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$backend->id}",
        [
            'parent_id' => $design->id,
        ]
    );

    $response->assertOk();

    expect(
        $backend->fresh()->parent_id
    )->toBe($design->id);
});

it('allows moving a child category to the root', function () {

    $parent = Category::factory()->create();

    $child = Category::factory()->create([
        'parent_id' => $parent->id,
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$child->id}",
        [
            'parent_id' => null,
        ]
    );

    $response->assertOk();

    expect(
        $child->fresh()->parent_id
    )->toBeNull();
});

it('detects circular references several levels deep', function () {

    $a = Category::factory()->create();

    $b = Category::factory()->create([
        'parent_id' => $a->id,
    ]);

    $c = Category::factory()->create([
        'parent_id' => $b->id,
    ]);

    $d = Category::factory()->create([
        'parent_id' => $c->id,
    ]);

    $e = Category::factory()->create([
        'parent_id' => $d->id,
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$a->id}",
        [
            'parent_id' => $e->id,
        ]
    );

    $response->assertUnprocessable();

    expect(
        $a->fresh()->parent_id
    )->toBeNull();
});

it('allows moving a category with children to another valid branch', function () {

    $programming = Category::factory()->create();

    $design = Category::factory()->create();

    $backend = Category::factory()->create([
        'parent_id' => $programming->id,
    ]);

    $php = Category::factory()->create([
        'parent_id' => $backend->id,
    ]);

    $response = $this->putJson(
        "/api/v1/categories/{$backend->id}",
        [
            'parent_id' => $design->id,
        ]
    );

    $response->assertOk();

    expect(
        $backend->fresh()->parent_id
    )->toBe($design->id);

    expect(
        $php->fresh()->parent_id
    )->toBe($backend->id);
});

it('rejects a non-existent parent', function () {

    $category = Category::factory()->create();

    $response = $this->putJson(
        "/api/v1/categories/{$category->id}",
        [
            'parent_id' => fake()->uuid(),
        ]
    );

    $response->assertUnprocessable();

    expect(
        $category->fresh()->parent_id
    )->toBeNull();
});

it('cannot move a category under an inactive parent', function () {

    $parent = Category::factory()->create([
        'is_active' => false,
    ]);

    $category = Category::factory()->create();

    $response = $this->putJson(
        "/api/v1/categories/{$category->id}",
        [
            'parent_id' => $parent->id,
        ]
    );

    $response->assertUnprocessable();

    expect(
        $category->fresh()->parent_id
    )->toBeNull();
});