<?php

namespace Database\Factories;

use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CourseProgressFactory extends Factory
{
    protected $model = CourseProgress::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'course_id' => Course::factory(),
            'started_at' => null,
            'progress_percentage' => 0,
            'time_spent' => 0,
            'completed_at' => null,
        ];
    }
}