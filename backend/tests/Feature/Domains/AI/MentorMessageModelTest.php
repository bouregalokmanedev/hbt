<?php

use App\Models\User;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use Database\Factories\Domains\AI\Models\MentorConversationFactory;
use App\Domains\AI\Enums\MentorConversationStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Domains\AI\Enums\MentorMessageRole;
uses(RefreshDatabase::class);

it('belongs to a mentor conversation', function () {
    $conversation = MentorConversation::factory()->create();

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
    ]);

    expect($message->conversation)
        ->toBeInstanceOf(MentorConversation::class)
        ->and($message->conversation->id)
        ->toBe($conversation->id);
});

it('stores a user message', function () {
    $message = MentorMessage::factory()->create([
        'role' => MentorMessageRole::USER,
        'content' => 'Why does my engine hesitate during acceleration?',
    ]);

    expect($message->role)
        ->toBe(MentorMessageRole::USER)
        ->and($message->content)
        ->toBe('Why does my engine hesitate during acceleration?');
});

it('stores an assistant message', function () {
    $message = MentorMessage::factory()
        ->assistant()
        ->create([
            'content' => 'A hesitation during acceleration can have several causes.',
        ]);

    expect($message->role)
        ->toBe(MentorMessageRole::ASSISTANT);
});

it('stores a system message', function () {
    $message = MentorMessage::factory()
        ->system()
        ->create([
            'content' => 'You are an automotive diagnostic mentor.',
        ]);

    expect($message->role)
        ->toBe(MentorMessageRole::SYSTEM);
});

it('stores metadata as an array', function () {
    $metadata = [
        'course_id' => 'course-123',
        'lesson_id' => 'lesson-456',
        'sources' => [
            'lesson',
            'quiz_result',
        ],
    ];

    $message = MentorMessage::factory()->create([
        'metadata' => $metadata,
    ]);

    expect($message->metadata)
        ->toBe($metadata);
});

it('belongs to a conversation that can have multiple messages', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    MentorMessage::factory()->count(3)->create([
        'mentor_conversation_id' => $conversation->id,
    ]);

    expect($conversation->messages)
        ->toHaveCount(3);
});