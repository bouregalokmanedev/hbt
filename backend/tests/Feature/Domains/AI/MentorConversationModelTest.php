<?php

use App\Models\Course;
use App\Domains\AI\Models\MentorConversation;
use App\Models\User;
use Database\Factories\Domains\AI\Models\MentorConversationFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Domains\AI\Enums\MentorConversationStatus;

uses(RefreshDatabase::class);

it('belongs to a user', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($conversation->user)
        ->toBeInstanceOf(User::class)
        ->and($conversation->user->id)
        ->toBe($user->id);
});

it('can belong to a course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    expect($conversation->course)
        ->toBeInstanceOf(Course::class)
        ->and($conversation->course->id)
        ->toBe($course->id);
});

it('can exist without a course', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
        'course_id' => null,
    ]);

    expect($conversation->course_id)
        ->toBeNull();
});

it('stores a title', function () {
    $conversation = MentorConversation::factory()->create([
        'title' => 'Engine Management Help',
    ]);

    expect($conversation->title)
        ->toBe('Engine Management Help');
});

it('stores mentor context as an array', function () {
    $context = [
        'course_id' => 'course-123',
        'lesson_id' => 'lesson-456',
        'assessment_id' => 'assessment-789',
        'topic' => 'fuel injection',
    ];

    $conversation = MentorConversation::factory()->create([
        'context' => $context,
    ]);

    expect($conversation->context)
        ->toBe($context);
});

it('defaults to an active status', function () {
    $conversation = MentorConversation::factory()->create();

    expect($conversation->status)
        ->toBe(MentorConversationStatus::ACTIVE);
});


    