<?php

namespace Database\Factories\Domains\AI\Models;

use App\Domains\AI\Enums\MentorConversationStatus;
use App\Domains\AI\Models\MentorConversation;
use App\Models\Course;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MentorConversationFactory extends Factory
{
    protected $model = MentorConversation::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'course_id' => null,
            'title' => null,
            'context' => null,
            'status' => MentorConversationStatus::ACTIVE,
        ];
    }

    public function withTitle(string $title = null): static
    {
        return $this->state(fn () => [
            'title' => $title ?? fake()->sentence(3),
        ]);
    }

    public function forCourse(Course $course): static
    {
        return $this->state(fn () => [
            'course_id' => $course->id,
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn () => [
            'status' => MentorConversationStatus::ARCHIVED,
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn () => [
            'status' => MentorConversationStatus::CLOSED,
        ]);
    }

    public function active(): static
    {
        return $this->state(fn () => [
            'status' => MentorConversationStatus::ACTIVE,
        ]);
    }
}