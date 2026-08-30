<?php

use App\Models\Course;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use Database\Factories\Domains\AI\Models\MentorConversationFactory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('deleting a user deletes their mentor conversations', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $conversationId = $conversation->id;

    $user->forceDelete();

    expect(
        MentorConversation::query()
            ->whereKey($conversationId)
            ->exists()
    )->toBeFalse();
});

it('deleting a course detaches the mentor conversation from the course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $conversationId = $conversation->id;

    $course->forceDelete();

    $conversation->refresh();

    expect($conversation->id)
        ->toBe($conversationId)
        ->and($conversation->course_id)
        ->toBeNull();
});

it('deleting a conversation deletes its messages', function () {
    $conversation = MentorConversation::factory()->create();

    $messages = MentorMessage::factory()
        ->count(3)
        ->create([
            'mentor_conversation_id' => $conversation->id,
        ]);

    $messageIds = $messages->pluck('id');

    $conversation->delete();

    expect(
        MentorMessage::query()
            ->whereIn('id', $messageIds)
            ->count()
    )->toBe(0);
});

it('allows multiple conversations for the same user', function () {
    $user = User::factory()->create();

    MentorConversation::factory()
        ->count(3)
        ->create([
            'user_id' => $user->id,
        ]);

    expect(
        MentorConversation::query()
            ->where('user_id', $user->id)
            ->count()
    )->toBe(3);
});

it('allows multiple messages in a conversation', function () {
    $conversation = MentorConversation::factory()->create();

    MentorMessage::factory()
        ->count(5)
        ->create([
            'mentor_conversation_id' => $conversation->id,
        ]);

    expect(
        $conversation->messages()->count()
    )->toBe(5);
});