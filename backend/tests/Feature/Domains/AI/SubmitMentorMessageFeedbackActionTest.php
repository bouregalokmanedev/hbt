<?php

use App\Domains\AI\Actions\SubmitMentorMessageFeedbackAction;
use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Enums\MentorFeedbackReason;
use App\Domains\AI\Enums\MentorMessageRole;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Models\MentorMessageFeedback;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;


uses(RefreshDatabase::class);

function feedbackAction(): SubmitMentorMessageFeedbackAction
{
    return app(SubmitMentorMessageFeedbackAction::class);
}

it('submits positive feedback for an assistant message', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => MentorMessageRole::ASSISTANT,
    ]);

    $feedback = feedbackAction()->execute(
        message: $message,
        user: $user,
        rating: MentorFeedbackRating::POSITIVE,
    );

    expect($feedback)
        ->toBeInstanceOf(MentorMessageFeedback::class);

    expect($feedback->rating)
        ->toBe(MentorFeedbackRating::POSITIVE);

    expect($feedback->user_id)
        ->toBe($user->id);

    expect($feedback->mentor_message_id)
        ->toBe($message->id);
});

it('submits negative feedback with a reason', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => MentorMessageRole::ASSISTANT,
    ]);

    $feedback = feedbackAction()->execute(
        message: $message,
        user: $user,
        rating: MentorFeedbackRating::NEGATIVE,
        reason: MentorFeedbackReason::INCORRECT->value,
        comment: 'The explanation contains an incorrect value.',
    );

    expect($feedback->rating)
        ->toBe(MentorFeedbackRating::NEGATIVE);

    expect($feedback->reason)
        ->toBe(MentorFeedbackReason::INCORRECT);

    expect($feedback->comment)
        ->toBe('The explanation contains an incorrect value.');
});

it('does not allow another user to provide feedback', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $owner->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => MentorMessageRole::ASSISTANT,
    ]);

    expect(fn () => feedbackAction()->execute(
        message: $message,
        user: $otherUser,
        rating: MentorFeedbackRating::POSITIVE,
    ))->toThrow(AuthorizationException::class);
});

it('does not allow feedback on a user message', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => MentorMessageRole::USER,
    ]);

    expect(fn () => feedbackAction()->execute(
        message: $message,
        user: $user,
        rating: MentorFeedbackRating::POSITIVE,
    ))->toThrow(LogicException::class);
});

it('updates existing feedback instead of creating a duplicate', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => MentorMessageRole::ASSISTANT,
    ]);

    $first = feedbackAction()->execute(
        message: $message,
        user: $user,
        rating: MentorFeedbackRating::NEGATIVE,
        reason: MentorFeedbackReason::UNCLEAR->value,
    );

    $second = feedbackAction()->execute(
        message: $message,
        user: $user,
        rating: MentorFeedbackRating::POSITIVE,
    );

    expect($second->id)
        ->toBe($first->id);

    expect(MentorMessageFeedback::query()
        ->where('mentor_message_id', $message->id)
        ->where('user_id', $user->id)
        ->count()
    )->toBe(1);

    expect($second->rating)
        ->toBe(MentorFeedbackRating::POSITIVE);
});

it('does not create feedback for another users message', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $owner->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => MentorMessageRole::ASSISTANT,
    ]);

    expect(fn () => feedbackAction()->execute(
        message: $message,
        user: $otherUser,
        rating: MentorFeedbackRating::NEGATIVE,
    ))->toThrow(AuthorizationException::class);

    expect(MentorMessageFeedback::query()->count())
        ->toBe(0);
});