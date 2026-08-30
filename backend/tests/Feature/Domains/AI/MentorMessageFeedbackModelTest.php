<?php

use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Enums\MentorFeedbackReason;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Models\MentorMessageFeedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates mentor message feedback', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'assistant',
    ]);

    $feedback = MentorMessageFeedback::factory()->create([
        'mentor_message_id' => $message->id,
        'user_id' => $user->id,
        'rating' => MentorFeedbackRating::POSITIVE,
    ]);

    expect($feedback->exists)->toBeTrue();
    expect($feedback->rating)
        ->toBe(MentorFeedbackRating::POSITIVE);
});

it('casts the rating to the feedback rating enum', function () {
    $feedback = MentorMessageFeedback::factory()->create();

    expect($feedback->rating)
        ->toBeInstanceOf(MentorFeedbackRating::class);
});

it('casts the reason to the feedback reason enum', function () {
    $feedback = MentorMessageFeedback::factory()->negative(
        MentorFeedbackReason::INCORRECT
    )->create();

    expect($feedback->reason)
        ->toBe(MentorFeedbackReason::INCORRECT);
});

it('belongs to a mentor message', function () {
    $feedback = MentorMessageFeedback::factory()->create();

    expect($feedback->message)
        ->toBeInstanceOf(MentorMessage::class);
});

it('belongs to a user', function () {
    $feedback = MentorMessageFeedback::factory()->create();

    expect($feedback->user)
        ->toBeInstanceOf(User::class);
});

it('supports comments', function () {
    $feedback = MentorMessageFeedback::factory()->create([
        'comment' => 'The explanation was very clear.',
    ]);

    expect($feedback->comment)
        ->toBe('The explanation was very clear.');
});

it('supports metadata', function () {
    $feedback = MentorMessageFeedback::factory()->create([
        'metadata' => [
            'source' => 'mentor_chat',
        ],
    ]);

    expect($feedback->metadata)
        ->toBe([
            'source' => 'mentor_chat',
        ]);
});

it('allows a message to access its feedback', function () {
    $feedback = MentorMessageFeedback::factory()->create();

    $feedback->message->load('feedback');

    expect($feedback->message->feedback?->is($feedback))
        ->toBeTrue();
});