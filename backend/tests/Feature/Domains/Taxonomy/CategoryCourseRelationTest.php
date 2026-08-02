<?php

use App\Domains\Taxonomy\Events\CategoryAttachedToCourse;
use App\Domains\Taxonomy\Events\CategoryDetachedFromCourse;
use App\Models\Category;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Role;
use Laravel\Sanctum\Sanctum;


uses(RefreshDatabase::class);

beforeEach(function () {

    $this->user = User::factory()->create();

    Role::firstOrCreate([
        'name' => 'Admin',
        'guard_name' => 'web',
    ]);

    $this->user->assignRole('Admin');

    Sanctum::actingAs(
        $this->user
    );
});
it('attaches a category to a course', function () {

    Event::fake();

    $category = Category::factory()->create();

    $course = Course::factory()->create();

    $response = $this->postJson(
        '/api/v1/categories/attach',
        [
            'category_id' => $category->id,
            'course_id' => $course->id,
        ]
    );

    $response
        ->assertOk();

    $this->assertDatabaseHas(
        'category_course',
        [
            'category_id' => $category->id,
            'course_id' => $course->id,
        ]
    );

    Event::assertDispatched(
        CategoryAttachedToCourse::class
    );
});


it('does not create duplicate category course relationships', function () {

    Event::fake();

    $category = Category::factory()->create();

    $course = Course::factory()->create();

    $category->courses()->attach(
        $course->id
    );

    $response = $this->postJson(
        '/api/v1/categories/attach',
        [
            'category_id' => $category->id,
            'course_id' => $course->id,
        ]
    );

    $response
        ->assertOk();

    expect(
        $category
            ->courses()
            ->whereKey($course->id)
            ->count()
    )->toBe(1);
});


it('detaches a category from a course', function () {

    Event::fake();

    $category = Category::factory()->create();

    $course = Course::factory()->create();

    $category->courses()->attach(
        $course->id
    );

    $response = $this->deleteJson(
        '/api/v1/categories/detach',
        [
            'category_id' => $category->id,
            'course_id' => $course->id,
        ]
    );

    $response
 ->assertOk();

    $this->assertDatabaseMissing(
        'category_course',
        [
            'category_id' => $category->id,
            'course_id' => $course->id,
        ]
    );

    Event::assertDispatched(
        CategoryDetachedFromCourse::class
    );
});


it('can attach multiple categories to one course', function () {

    $course = Course::factory()->create();

    $categories = Category::factory()
        ->count(3)
        ->create();

    foreach ($categories as $category) {

        $response = $this->postJson(
            '/api/v1/categories/attach',
            [
                'category_id' => $category->id,
                'course_id' => $course->id,
            ]
        );

        $response->assertOk();
    }

    expect(
        $course->categories()->count()
    )->toBe(3);
});


it('can attach one category to multiple courses', function () {

    $category = Category::factory()->create();

    $courses = Course::factory()
        ->count(3)
        ->create();

    foreach ($courses as $course) {

        $response = $this->postJson(
            '/api/v1/categories/attach',
            [
                'category_id' => $category->id,
                'course_id' => $course->id,
            ]
        );

        $response->assertOk();
    }

    expect(
        $category->courses()->count()
    )->toBe(3);
});


it('rejects an unknown category', function () {

    $course = Course::factory()->create();

    $response = $this->postJson(
        '/api/v1/categories/attach',
        [
            'category_id' => fake()->uuid(),
            'course_id' => $course->id,
        ]
    );

    $response
        ->assertUnprocessable();
});


it('rejects an unknown course', function () {

    $category = Category::factory()->create();

    $response = $this->postJson(
        '/api/v1/categories/attach',
        [
            'category_id' => $category->id,
            'course_id' => fake()->uuid(),
        ]
    );

    $response
        ->assertUnprocessable();
});


it('does not fail when detaching a relationship that does not exist', function () {

    $category = Category::factory()->create();

    $course = Course::factory()->create();

    $response = $this->deleteJson(
        '/api/v1/categories/detach',
        [
            'category_id' => $category->id,
            'course_id' => $course->id,
        ]
    );

    $response
        ->assertOk();

    expect(
        $category
            ->courses()
            ->whereKey($course->id)
            ->exists()
    )->toBeFalse();
});