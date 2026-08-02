<?php

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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


it('returns root categories', function () {

    $root = Category::factory()->create([
        'name' => 'Programming',
        'parent_id' => null,
    ]);

    Category::factory()->create([
        'name' => 'Backend',
        'parent_id' => $root->id,
    ]);

    $response = $this->getJson(
        '/api/v1/categories/roots'
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.0.name',
            'Programming'
        );
});


it('returns the complete category tree', function () {

    $programming = Category::factory()->create([
        'name' => 'Programming',
        'parent_id' => null,
    ]);

    $backend = Category::factory()->create([
        'name' => 'Backend',
        'parent_id' => $programming->id,
    ]);

    $php = Category::factory()->create([
        'name' => 'PHP',
        'parent_id' => $backend->id,
    ]);

    $response = $this->getJson(
        '/api/v1/categories/tree'
    );

    $response
        ->assertOk();

    $response->assertJsonPath(
        'data.0.name',
        'Programming'
    );

    $response->assertJsonPath(
        'data.0.children.0.name',
        'Backend'
    );

    $response->assertJsonPath(
        'data.0.children.0.children.0.name',
        'PHP'
    );
});


it('returns direct children of a category', function () {

    $parent = Category::factory()->create([
        'name' => 'Programming',
    ]);

    $backend = Category::factory()->create([
        'name' => 'Backend',
        'parent_id' => $parent->id,
    ]);

    Category::factory()->create([
        'name' => 'PHP',
        'parent_id' => $backend->id,
    ]);

    $response = $this->getJson(
        "/api/v1/categories/{$parent->id}/children"
    );

    $response
        ->assertOk()
        ->assertJsonCount(
            1,
            'data'
        )
        ->assertJsonPath(
            'data.0.name',
            'Backend'
        );
});


it('returns an empty children collection for a leaf category', function () {

    $category = Category::factory()->create();

    $response = $this->getJson(
        "/api/v1/categories/{$category->id}/children"
    );

    $response
        ->assertOk()
        ->assertJsonCount(
            0,
            'data'
        );
});


it('returns the breadcrumb for a category', function () {

    $programming = Category::factory()->create([
        'name' => 'Programming',
    ]);

    $backend = Category::factory()->create([
        'name' => 'Backend',
        'parent_id' => $programming->id,
    ]);

    $php = Category::factory()->create([
        'name' => 'PHP',
        'parent_id' => $backend->id,
    ]);

    $response = $this->getJson(
        "/api/v1/categories/{$php->id}/breadcrumb"
    );

    $response
        ->assertOk();

    $response->assertJsonPath(
        'data.0.name',
        'Programming'
    );

    $response->assertJsonPath(
        'data.1.name',
        'Backend'
    );

    $response->assertJsonPath(
        'data.2.name',
        'PHP'
    );
});


it('does not include child categories as roots', function () {

    $root = Category::factory()->create();

    Category::factory()->create([
        'parent_id' => $root->id,
    ]);

    $response = $this->getJson(
        '/api/v1/categories/roots'
    );

    $response
        ->assertOk()
        ->assertJsonCount(
            1,
            'data'
        );
});


it('returns categories in sort order', function () {

    Category::factory()->create([
        'name' => 'Third',
        'sort_order' => 3,
        'parent_id' => null,
    ]);

    Category::factory()->create([
        'name' => 'First',
        'sort_order' => 1,
        'parent_id' => null,
    ]);

    Category::factory()->create([
        'name' => 'Second',
        'sort_order' => 2,
        'parent_id' => null,
    ]);

    $response = $this->getJson(
        '/api/v1/categories/roots'
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.0.name',
            'First'
        )
        ->assertJsonPath(
            'data.1.name',
            'Second'
        )
        ->assertJsonPath(
            'data.2.name',
            'Third'
        );
});