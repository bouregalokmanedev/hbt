<?php

namespace Database\Factories;

use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class LessonProgressFactory extends Factory
{
    protected $model = LessonProgress::class;

    public function definition(): array
{
    return [
        'user_id' => User::factory(),
        'lesson_id' => Lesson::factory(),
        'started_at' => now(),
        'progress_percentage' => 0,
        'time_spent' => 0,
        'last_position' => null,
        'video_position' => null,
        'completed_at' => null,
    ];
}
public function inProgress(): static
{
    return $this->state(fn () => [
        'started_at' => now()->subMinutes(10),
        'progress_percentage' => 50,
        'time_spent' => 600,
        'last_position' => 5,
        'video_position' => 300,
        'completed_at' => null,
    ]);
}

public function completed(): static
{
    return $this->state(fn () => [
        'started_at' => now()->subMinutes(20),
        'progress_percentage' => 100,
        'time_spent' => 1200,
        'last_position' => 10,
        'video_position' => 1200,
        'completed_at' => now(),
    ]);
}
}