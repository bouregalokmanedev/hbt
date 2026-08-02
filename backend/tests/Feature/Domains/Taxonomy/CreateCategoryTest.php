<?php

use App\Domains\Taxonomy\Events\CategoryCreated;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create([
        'email_verified_at' => now(),
    ]);

    Role::firstOrCreate([
        'name' => 'Admin',
        'guard_name' => 'web',
    ]);

    $this->user->assignRole('Admin');

    Sanctum::actingAs(
        $this->user,
        ['*'],
        'sanctum'
    );
});
function authenticateAsAdmin(): void
{
    Sanctum::actingAs(test()->user);
}


it('creates a root category', function () {

    $this->withoutExceptionHandling();

    $payload = [
        'name' => 'Programming',
        'slug' => 'programming',
    ];

    $response = $this->postJson(
        '/api/v1/categories',
        $payload
    );

    $response
        ->assertCreated()
        ->assertJsonPath(
            'data.name',
            'Programming'
        );
});


it('creates a child category', function () {

    Event::fake();

    $parent = Category::factory()->create([
        'name' => 'Programming',
        'slug' => 'programming',
        'is_active' => true,
    ]);

    $payload = [
        'name' => 'Backend',
        'slug' => 'backend',
        'description' => 'Backend development',
        'parent_id' => $parent->id,
        'is_active' => true,
        'sort_order' => 0,
    ];

    $response = $this->postJson(
        '/api/v1/categories',
        $payload
    );

    $response
        ->assertCreated();

    $this->assertDatabaseHas(
        'categories',
        [
            'name' => 'Backend',
            'slug' => 'backend',
            'parent_id' => $parent->id,
        ]
    );

    Event::assertDispatched(
        CategoryCreated::class
    );
});


it('rejects a non-existent parent category', function () {

    $payload = [
        'name' => 'Backend',
        'slug' => 'backend',
        'parent_id' => fake()->uuid(),
        'is_active' => true,
    ];

    $response = $this->postJson(
        '/api/v1/categories',
        $payload
    );

    $response
        ->assertUnprocessable();

    expect(
        Category::query()
            ->where('slug', 'backend')
            ->exists()
    )->toBeFalse();
});


it('rejects an inactive parent category', function () {

    $parent = Category::factory()->create([
        'is_active' => false,
    ]);

    $payload = [
        'name' => 'Backend',
        'slug' => 'backend',
        'parent_id' => $parent->id,
        'is_active' => true,
    ];

    $response = $this->postJson(
        '/api/v1/categories',
        $payload
    );

    $response
        ->assertUnprocessable();

    expect(
        Category::where('slug', 'backend')->exists()
    )->toBeFalse();
});


it('rejects a duplicate category slug', function () {

    Category::factory()->create([
        'slug' => 'programming',
    ]);

    $payload = [
        'name' => 'Another Programming',
        'slug' => 'programming',
        'is_active' => true,
    ];

    $response = $this->postJson(
        '/api/v1/categories',
        $payload
    );

    $response
        ->assertUnprocessable();

    expect(
        Category::where('slug', 'programming')->count()
    )->toBe(1);
});


it('requires a category name', function () {

    $response = $this->postJson(
        '/api/v1/categories',
        [
            'slug' => 'programming',
        ]
    );

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'name',
        ]);
});


it('requires a category slug', function () {

    $response = $this->postJson(
        '/api/v1/categories',
        [
            'name' => 'Programming',
        ]
    );

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'slug',
        ]);
});


it('prevents an unauthenticated user from creating a category', function () {

    $this->app['auth']->forgetGuards();

    $response = $this->postJson(
        '/api/v1/categories',
        [
            'name' => 'Programming',
            'slug' => 'programming',
        ]
    );

    $response->assertUnauthorized();
});

it('prevents an unauthorized user from creating a category', function () {

    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->postJson(
        '/api/v1/categories',
        [
            'name' => 'Programming',
            'slug' => 'programming',
        ]
    );

    $response
        ->assertForbidden();
});