<?php

use App\Domains\AI\Services\MentorContextService;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('includes the student profile in mentor context', function () {
    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    expect($context->studentProfile)->not->toBeNull()
        ->and($context->studentProfile->userId)
        ->toBe((string) $user->id);
});

it('includes the student learning level in mentor context', function () {
    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    expect($context->toArray())
        ->toHaveKey('student_profile')
        ->and($context->toArray()['student_profile'])
        ->toHaveKey('learning_level');
});

it('builds a course-specific student profile', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    CourseProgress::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 75,
    ]);

    $context = app(MentorContextService::class)
        ->build(
            $user,
            $course->id,
        );

    expect($context->courseId)
        ->toBe($course->id)
        ->and($context->studentProfile->courseId)
        ->toBe($course->id)
        ->and($context->studentProfile->courseProgress)
        ->toBe(75);
});

it('serializes the student profile as part of mentor context', function () {
    $user = User::factory()->create();

    $context = app(MentorContextService::class)
        ->build($user);

    $array = $context->toArray();

    expect($array)
        ->toHaveKey('student_profile')
        ->and($array['student_profile'])
        ->toBeArray()
        ->and($array['student_profile']['user_id'])
        ->toBe((string) $user->id);
});