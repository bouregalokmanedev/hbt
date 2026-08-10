<?php

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Course Search API
|--------------------------------------------------------------------------
*/

it('lists courses with pagination', function () {
    $instructor = User::factory()->create();

    Course::factory()
        ->count(20)
        ->for($instructor, 'instructor')
        ->create([
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses');

    $response
        ->assertSuccessful()
        ->assertJsonStructure([
            'data',
            'links',
            'meta',
        ]);

    expect($response->json('data'))->toHaveCount(15);
});

it('searches courses by title', function () {
    $instructor = User::factory()->create();

    $matchingCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Advanced Laravel Architecture',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Introduction to Python',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?search=Laravel');

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $matchingCourse->id,
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

it('searches courses by description', function () {
    $instructor = User::factory()->create();

    $matchingCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Backend Development',
            'description' => 'Learn scalable Laravel application architecture.',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Frontend Development',
            'description' => 'Learn modern JavaScript and browser APIs.',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?search=Laravel');

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $matchingCourse->id,
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

it('searches courses case insensitively', function () {
    $instructor = User::factory()->create();

    $course = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Laravel Masterclass',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?search=laravel');

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $course->id,
        ]);
});

it('filters courses by difficulty', function () {
    $instructor = User::factory()->create();

    $beginner = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Beginner Laravel',
            'difficulty' => Difficulty::BEGINNER,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Advanced Laravel',
            'difficulty' => Difficulty::ADVANCED,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?difficulty=beginner');

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $beginner->id,
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

it('filters free courses', function () {
    $instructor = User::factory()->create();

    $freeCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Free Laravel Course',
            'is_free' => true,
            'price' => 0,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Paid Laravel Course',
            'is_free' => false,
            'price' => 100,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?free=1');

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $freeCourse->id,
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

it('filters courses by instructor', function () {
    $instructor = User::factory()->create();
    $otherInstructor = User::factory()->create();

    $instructorCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Instructor Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    Course::factory()
        ->for($otherInstructor, 'instructor')
        ->create([
            'title' => 'Other Instructor Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson(
            '/api/v1/courses?instructor=' . $instructor->id
        );

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $instructorCourse->id,
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

it('filters courses by visibility', function () {
    $instructor = User::factory()->create();

    $publicCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Public Course',
            'visibility' => Visibility::PUBLIC,
            'status' => CourseStatus::PUBLISHED,
        ]);

    Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Private Course',
            'visibility' => Visibility::PRIVATE,
            'status' => CourseStatus::DRAFT,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?visibility=public');

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $publicCourse->id,
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

it('filters courses by status', function () {
    $instructor = User::factory()->create();

    $publishedCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Published Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Draft Course',
            'status' => CourseStatus::DRAFT,
            'visibility' => Visibility::PRIVATE,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?status=published');

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $publishedCourse->id,
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

it('supports multiple search filters together', function () {
    $instructor = User::factory()->create();

    $matchingCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Laravel Beginner Course',
            'description' => 'Learn Laravel from scratch.',
            'difficulty' => Difficulty::BEGINNER,
            'is_free' => true,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Laravel Advanced Course',
            'description' => 'Advanced Laravel development.',
            'difficulty' => Difficulty::ADVANCED,
            'is_free' => true,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Beginner PHP Course',
            'description' => 'Learn PHP from scratch.',
            'difficulty' => Difficulty::BEGINNER,
            'is_free' => false,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson(
            '/api/v1/courses'
            . '?search=Laravel'
            . '&difficulty=beginner'
            . '&free=1'
            . '&status=published'
            . '&visibility=public'
        );

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $matchingCourse->id,
        ]);

    expect($response->json('data'))->toHaveCount(1);
});

it('supports custom pagination size', function () {
    $instructor = User::factory()->create();

    Course::factory()
        ->count(10)
        ->for($instructor, 'instructor')
        ->create([
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?per_page=5');

    $response
        ->assertSuccessful()
        ->assertJsonStructure([
            'data',
            'links',
            'meta',
        ]);

    expect($response->json('data'))->toHaveCount(5);
    expect($response->json('meta.per_page'))->toBe(5);
});

it('supports pagination using the page parameter', function () {
    $instructor = User::factory()->create();

    Course::factory()
        ->count(20)
        ->for($instructor, 'instructor')
        ->create([
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $firstPage = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?per_page=5&page=1')
        ->assertSuccessful();

    $secondPage = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?per_page=5&page=2')
        ->assertSuccessful();

    expect($firstPage->json('data'))
        ->not->toEqual($secondPage->json('data'));

    expect($secondPage->json('meta.current_page'))->toBe(2);
});

it('does not return soft deleted courses', function () {
    $instructor = User::factory()->create();

    $activeCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Active Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $deletedCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Deleted Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $deletedCourse->delete();

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses');

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $activeCourse->id,
        ])
        ->assertJsonMissing([
            'id' => $deletedCourse->id,
        ]);
});

it('returns an empty result when no courses match the search', function () {
    $instructor = User::factory()->create();

    Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Laravel Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $response = $this->actingAs($instructor)
        ->getJson('/api/v1/courses?search=NonExistentCourse');

    $response
        ->assertSuccessful()
        ->assertJsonStructure([
            'data',
            'links',
            'meta',
        ]);

    expect($response->json('data'))->toBe([]);
});

it('allows unauthenticated public course search', function () {
    Course::factory()->create([
        'title' => 'Public Laravel Course',
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);

    $response = $this->getJson(
        '/api/v1/courses?search=Laravel'
    );

    $response->assertSuccessful();
});

it('does not expose private courses in the public published catalog', function () {
    $instructor = User::factory()->create();

    $publicCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Public Laravel Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

    $privateCourse = Course::factory()
        ->for($instructor, 'instructor')
        ->create([
            'title' => 'Private Laravel Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PRIVATE,
        ]);

    $response = $this->getJson(
        '/api/v1/courses?search=Laravel'
    );

    $response
        ->assertSuccessful()
        ->assertJsonFragment([
            'id' => $publicCourse->id,
        ])
        ->assertJsonMissing([
            'id' => $privateCourse->id,
        ]);
});