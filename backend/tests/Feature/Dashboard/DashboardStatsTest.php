<?php

use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns enrollment-backed stats and current learning', function () {
    $user = User::factory()->create();
    $activeCourse = Course::factory()->create();
    $completedCourse = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $activeCourse->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $completedCourse->id,
        'status' => EnrollmentStatus::COMPLETED,
    ]);

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $activeCourse->id,
        'progress_percentage' => 40,
        'time_spent' => 5400,
    ]);

    $this->actingAs($user)
        ->getJson('/api/v1/auth/dashboard')
        ->assertOk()
        ->assertJsonPath('data.stats.active_courses', 1)
        ->assertJsonPath('data.stats.completed_courses', 1)
        ->assertJsonPath('data.stats.learning_hours', 1)
        ->assertJsonPath('data.stats.current_progress', 40)
        ->assertJsonPath('data.current_learning.0.id', $activeCourse->id)
        ->assertJsonPath('data.current_learning.0.progress', 40);
});
