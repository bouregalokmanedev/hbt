<?php

use App\Enums\Courses\CourseStatus;
use App\Enums\Courses\Visibility;
use App\Enums\LessonStatus;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('enrolls a student, saves lesson progress, and completes the lesson', function () {
    $student = User::factory()->create(['email_verified_at' => now()]);
    $course = Course::factory()->create([
        'status' => CourseStatus::PUBLISHED,
        'visibility' => Visibility::PUBLIC,
    ]);
    $section = Section::factory()->create([
        'course_id' => $course->id,
        'status' => SectionStatus::PUBLISHED,
    ]);
    $lesson = Lesson::factory()->create([
        'section_id' => $section->id,
        'status' => LessonStatus::PUBLISHED,
    ]);

    $this->actingAs($student)
        ->postJson('/api/v1/enrollments', ['course_id' => $course->id])
        ->assertCreated()
        ->assertJsonPath('data.course_id', $course->id);

    $this->actingAs($student)
        ->patchJson("/api/v1/lessons/{$lesson->id}/progress", [
            'progress_percentage' => 45,
            'time_spent' => 600,
        ])
        ->assertOk()
        ->assertJsonPath('data.progress_percentage', 45);

    $this->actingAs($student)
        ->postJson("/api/v1/lessons/{$lesson->id}/complete")
        ->assertCreated()
        ->assertJsonPath('progress_percentage', 100)
        ->assertJsonPath('is_completed', true);

    expect(Enrollment::query()->where('user_id', $student->id)->where('course_id', $course->id)->exists())->toBeTrue();
    expect(LessonProgress::query()->where('user_id', $student->id)->where('lesson_id', $lesson->id)->value('completed_at'))->not->toBeNull();
});
