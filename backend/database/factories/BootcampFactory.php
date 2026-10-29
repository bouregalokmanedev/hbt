<?php

namespace Database\Factories;

use App\Enums\Bootcamps\BootcampStatus;
use App\Enums\Courses\Difficulty;
use App\Models\Bootcamp;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Bootcamp>
 */
class BootcampFactory extends Factory
{
    protected $model = Bootcamp::class;

    public function definition(): array
    {
        $title = 'Bootcamp '.Str::title(fake()->unique()->words(3, true));

        return [
            'instructor_id' => User::factory(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.Str::lower(Str::random(6)),
            'short_description' => fake()->sentence(12),
            'description' => fake()->paragraphs(2, true),
            'duration_value' => 4,
            'duration_unit' => 'weeks',
            'location' => 'Algiers Campus',
            'price' => 89000,
            'currency' => 'DZD',
            'level' => Difficulty::INTERMEDIATE,
            'includes' => [
                'challenges' => true,
                'resources' => true,
                'quizzes' => true,
                'support' => true,
                'certificate' => true,
            ],
            'status' => BootcampStatus::DRAFT,
            'brochure_path' => null,
            'brochure_original_name' => null,
            'published_at' => null,
        ];
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => BootcampStatus::PUBLISHED,
            'published_at' => now(),
        ]);
    }
}
