<?php

use App\Domains\AI\Actions\CreateMentorConversationAction;
use Database\Factories\Domains\AI\Models\MentorConversationFactory;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Enums\MentorConversationStatus;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createMentorConversationAction(): CreateMentorConversationAction
{
    return app(CreateMentorConversationAction::class);
}

it('creates a mentor conversation for a user', function () {
    $user = User::factory()->create();

    $conversation = createMentorConversationAction()->execute(
        $user,
    );

    expect($conversation)
        ->toBeInstanceOf(MentorConversation::class)
        ->and($conversation->user_id)
        ->toBe($user->id)
        ->and($conversation->course_id)
        ->toBeNull()
        ->and($conversation->status)
        ->toBe(MentorConversationStatus::ACTIVE);
});

it('creates a conversation with a title', function () {
    $user = User::factory()->create();

    $conversation = createMentorConversationAction()->execute(
        $user,
        title: 'Engine Diagnostics Mentor',
    );

    expect($conversation->title)
        ->toBe('Engine Diagnostics Mentor');
});

it('can create a conversation for an enrolled course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $conversation = createMentorConversationAction()->execute(
        $user,
        courseId: $course->id,
    );

    expect($conversation->course_id)
        ->toBe($course->id);
});

it('does not allow a conversation for a course the user is not enrolled in', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    expect(fn () => createMentorConversationAction()->execute(
        $user,
        courseId: $course->id,
    ))->toThrow(LogicException::class);

    expect(
        MentorConversation::query()
            ->where('user_id', $user->id)
            ->count()
    )->toBe(0);
});

it('stores mentor context when creating a course conversation', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $conversation = createMentorConversationAction()->execute(
        $user,
        courseId: $course->id,
    );

    expect($conversation->context)
        ->toBeArray()
        ->and($conversation->context['user_id'])
        ->toBe((string) $user->id)
        ->and($conversation->context['course_id'])
        ->toBe($course->id);
});

it('creates multiple conversations for the same user', function () {
    $user = User::factory()->create();

    $first = createMentorConversationAction()->execute(
        $user,
        title: 'Engine Diagnostics',
    );

    $second = createMentorConversationAction()->execute(
        $user,
        title: 'CAN Bus',
    );

    expect($first->id)
        ->not->toBe($second->id);

    expect(
        MentorConversation::query()
            ->where('user_id', $user->id)
            ->count()
    )->toBe(2);
});