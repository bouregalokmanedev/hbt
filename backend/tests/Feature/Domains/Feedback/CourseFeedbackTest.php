<?php

use App\Models\Course;
use App\Models\CourseFeedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('stores authenticated student feedback for a course', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);
    $course = Course::factory()->create();

    $this->actingAs($student)
        ->postJson("/api/v1/courses/{$course->id}/feedback", [
            'rating' => 5,
            'comment' => 'Clear and useful lesson.',
        ])
        ->assertCreated()
        ->assertJsonPath('data.rating', 5);

    expect(CourseFeedback::query()->where('course_id', $course->id)->where('user_id', $student->id)->exists())->toBeTrue();
});
