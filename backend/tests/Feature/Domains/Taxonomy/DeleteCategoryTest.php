<?php

use App\Domains\Taxonomy\Events\CategoryDeleted;
use App\Models\Category;
use App\Models\Course;
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

it('deletes an empty child category', function () {

    Event::fake();

    $parent = Category::factory()->create();

    $category = Category::factory()->create([
        'parent_id' => $parent->id,
    ]);

    $response = $this->deleteJson(
        "/api/v1/categories/{$category->id}"
    );

    $response
        ->assertOk();

    $this->assertDatabaseMissing(
        'categories',
        [
            'id' => $category->id,
        ]
    );

    Event::assertDispatched(
        CategoryDeleted::class
    );
});


it('cannot delete a root category', function () {

    $category = Category::factory()->create([
        'parent_id' => null,
    ]);

    $response = $this->deleteJson(
        "/api/v1/categories/{$category->id}"
    );

    $response
        ->assertConflict();

    $this->assertDatabaseHas(
        'categories',
        [
            'id' => $category->id,
        ]
    );
});


it('cannot delete a category with children', function () {

    $parent = Category::factory()->create();

    $child = Category::factory()->create([
        'parent_id' => $parent->id,
    ]);

    $response = $this->deleteJson(
        "/api/v1/categories/{$parent->id}"
    );

    $response
        ->assertConflict();

    $this->assertDatabaseHas(
        'categories',
        [
            'id' => $parent->id,
        ]
    );

    $this->assertDatabaseHas(
        'categories',
        [
            'id' => $child->id,
        ]
    );
});


it('cannot delete a category assigned to a course', function () {

    $parent = Category::factory()->create();

    $category = Category::factory()->create([
        'parent_id' => $parent->id,
    ]);

    $course = Course::factory()->create();

    $category->courses()->attach(
        $course->id
    );

    $response = $this->deleteJson(
        "/api/v1/categories/{$category->id}"
    );

    $response
        ->assertConflict();

    $this->assertDatabaseHas(
        'categories',
        [
            'id' => $category->id,
        ]
    );
});


it('returns not found when deleting an unknown category', function () {

    $response = $this->deleteJson(
        '/api/v1/categories/' . fake()->uuid()
    );

    $response
        ->assertNotFound();
});


it('prevents an unauthorized user from deleting a category', function () {

    $user = User::factory()->create();

    $this->actingAs($user);

    $parent = Category::factory()->create();

    $category = Category::factory()->create([
        'parent_id' => $parent->id,
    ]);

    $response = $this->deleteJson(
        "/api/v1/categories/{$category->id}"
    );

    $response
        ->assertForbidden();

    $this->assertDatabaseHas(
        'categories',
        [
            'id' => $category->id,
        ]
    );
});


it('does not delete the category when deletion fails', function () {

    $parent = Category::factory()->create();

    $category = Category::factory()->create([
        'parent_id' => $parent->id,
    ]);

    $course = Course::factory()->create();

    $category->courses()->attach(
        $course->id
    );

    $response = $this->deleteJson(
        "/api/v1/categories/{$category->id}"
    );

    $response->assertConflict();

    expect(
        Category::find($category->id)
    )->not->toBeNull();
});