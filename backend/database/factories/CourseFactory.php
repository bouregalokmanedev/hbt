<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Course;
use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition(): array
    {
        return [
            'instructor_id' => User::factory(),

            'title' => fake()->sentence(4),
            'slug' => fake()->unique()->slug(),
            'short_description' => fake()->sentence(),
            'description' => fake()->paragraph(),

            'language' => 'en',
            'duration_minutes' => fake()->numberBetween(30, 300),

            'price' => 0,
            'discount_price' => null,
            'currency' => 'DZD',

            'is_free' => true,

            'status' => CourseStatus::DRAFT,
            'visibility' => Visibility::PRIVATE,

            'published_at' => null,

            'thumbnail' => null,
            'cover_image' => null,
            'preview_video' => null,

            'meta_title' => null,
            'meta_description' => null,

            'metadata' => null,
        ];
    }
}