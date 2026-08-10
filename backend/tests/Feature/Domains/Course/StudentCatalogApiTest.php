<?php

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Difficulty;
use App\Enums\Courses\Visibility;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Student catalog', function () {
    it('returns only published public courses', function () {
        $publishedPublic = Course::factory()->create([
            'title' => 'Published Public Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        Course::factory()->create([
            'title' => 'Draft Public Course',
            'status' => CourseStatus::DRAFT,
            'visibility' => Visibility::PUBLIC,
        ]);

        Course::factory()->create([
            'title' => 'Published Private Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PRIVATE,
        ]);

        Course::factory()->create([
            'title' => 'Review Public Course',
            'status' => CourseStatus::REVIEW,
            'visibility' => Visibility::PUBLIC,
        ]);

        Course::factory()->create([
            'title' => 'Archived Public Course',
            'status' => CourseStatus::ARCHIVED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses'
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $publishedPublic->id
            )
            ->assertJsonPath(
                'data.0.title',
                'Published Public Course'
            );
    });

    it('does not require authentication', function () {
        Course::factory()->create([
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $this->getJson(
            '/api/v1/catalog/courses'
        )->assertOk();
    });

    it('supports search', function () {
        $matching = Course::factory()->create([
            'title' => 'Laravel for Beginners',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        Course::factory()->create([
            'title' => 'Python Fundamentals',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?search=Laravel'
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $matching->id
            );
    });

    it('supports difficulty filtering', function () {
        $beginner = Course::factory()->create([
            'title' => 'Beginner Course',
            'difficulty' => Difficulty::BEGINNER,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        Course::factory()->create([
            'title' => 'Advanced Course',
            'difficulty' => Difficulty::ADVANCED,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?difficulty=' .
            Difficulty::BEGINNER->value
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $beginner->id
            );
    });

    it('supports free course filtering', function () {
        $free = Course::factory()->create([
            'title' => 'Free Course',
            'is_free' => true,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        Course::factory()->create([
            'title' => 'Paid Course',
            'is_free' => false,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?free=1'
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $free->id
            );
    });

    it('supports language filtering', function () {
        $english = Course::factory()->create([
            'title' => 'English Course',
            'language' => 'en',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        Course::factory()->create([
            'title' => 'French Course',
            'language' => 'fr',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?language=en'
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $english->id
            );
    });

    it('supports category filtering', function () {
        $category = Category::factory()->create();

        $matching = Course::factory()->create([
            'title' => 'Laravel Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $matching->categories()->attach($category);

        Course::factory()->create([
            'title' => 'Unrelated Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?category=' .
            $category->id
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $matching->id
            );
    });

    it('combines filters', function () {
        $matching = Course::factory()->create([
            'title' => 'Laravel Beginner Course',
            'difficulty' => Difficulty::BEGINNER,
            'language' => 'en',
            'is_free' => true,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        Course::factory()->create([
            'title' => 'Laravel Advanced Course',
            'difficulty' => Difficulty::ADVANCED,
            'language' => 'en',
            'is_free' => true,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        Course::factory()->create([
            'title' => 'Python Beginner Course',
            'difficulty' => Difficulty::BEGINNER,
            'language' => 'en',
            'is_free' => true,
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?' .
            http_build_query([
                'search' => 'Laravel',
                'difficulty' => Difficulty::BEGINNER->value,
                'free' => 1,
                'language' => 'en',
            ])
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $matching->id
            );
    });

    it('cannot expose unpublished courses through search', function () {
        Course::factory()->create([
            'title' => 'Secret Laravel Draft',
            'status' => CourseStatus::DRAFT,
            'visibility' => Visibility::PUBLIC,
        ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?search=Laravel'
        );

        $response
            ->assertOk()
            ->assertJsonCount(0, 'data');
    });

    it('cannot expose private courses through search', function () {
        Course::factory()->create([
            'title' => 'Private Laravel Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PRIVATE,
        ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?search=Laravel'
        );

        $response
            ->assertOk()
            ->assertJsonCount(0, 'data');
    });

    it('ignores status supplied by the client', function () {
        $published = Course::factory()->create([
            'title' => 'Published Course',
            'status' => CourseStatus::PUBLISHED,
            'visibility' => Visibility::PUBLIC,
        ]);

        Course::factory()->create([
            'title' => 'Draft Course',
            'status' => CourseStatus::DRAFT,
            'visibility' => Visibility::PUBLIC,
        ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?status=draft'
        );

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath(
                'data.0.id',
                $published->id
            );
    });

    it('supports pagination', function () {
        Course::factory()
            ->count(20)
            ->create([
                'status' => CourseStatus::PUBLISHED,
                'visibility' => Visibility::PUBLIC,
            ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?per_page=5'
        );

        $response
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath(
                'meta.per_page',
                5
            );
    });

    it('caps pagination at 100', function () {
        Course::factory()
            ->count(110)
            ->create([
                'status' => CourseStatus::PUBLISHED,
                'visibility' => Visibility::PUBLIC,
            ]);

        $response = $this->getJson(
            '/api/v1/catalog/courses?per_page=1000'
        );

        $response
            ->assertOk()
            ->assertJsonCount(100, 'data')
            ->assertJsonPath(
                'meta.per_page',
                100
            );
    });
});
