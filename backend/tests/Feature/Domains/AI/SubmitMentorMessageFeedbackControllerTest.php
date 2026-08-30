<?php

use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Models\MentorMessageFeedback;
use App\Domains\AI\Enums\MentorMessageRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function feedbackEndpoint(MentorMessage $message): string
{
    return "/api/v1/mentor/messages/{$message->id}/feedback";
}

it('requires authentication to submit feedback', function () {
    $message = MentorMessage::factory()->create([
        'role' => MentorMessageRole::ASSISTANT,
    ]);

    $this->postJson(
        feedbackEndpoint($message),
        [
            'rating' => 'positive',
        ]
    )->assertUnauthorized();
});

it('submits positive feedback for an assistant message', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => MentorMessageRole::ASSISTANT,
        'content' => 'Fuel trim is positive.',
    ]);

    $response = $this->actingAs($user)->postJson(
        feedbackEndpoint($message),
        [
            'rating' => 'positive',
            'comment' => 'Very useful explanation.',
        ]
    );

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.mentor_message_id', $message->id)
        ->assertJsonPath('data.user_id', $user->id)
        ->assertJsonPath('data.rating', 'positive')
        ->assertJsonPath(
            'data.comment',
            'Very useful explanation.'
        );

    expect(
        MentorMessageFeedback::query()
            ->where('mentor_message_id', $message->id)
            ->where('user_id', $user->id)
            ->exists()
    )->toBeTrue();
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

    $response = $this->actingAs($user)->postJson(
        feedbackEndpoint($message),
        [
            'rating' => 'negative',
            'reason' => 'incorrect',
            'comment' => 'The explanation is incorrect.',
        ]
    );

    $response
        ->assertSuccessful()
        ->assertJsonPath('data.rating', 'negative')
        ->assertJsonPath('data.reason', 'incorrect')
        ->assertJsonPath(
            'data.comment',
            'The explanation is incorrect.'
        );
});

it('does not allow another user to provide feedback', function () {
    $owner = User::factory()->create();
    $anotherUser = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $owner->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => MentorMessageRole::ASSISTANT,
    ]);

    $this->actingAs($anotherUser)
        ->postJson(
            feedbackEndpoint($message),
            [
                'rating' => 'positive',
            ]
        )
        ->assertForbidden();
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

    $this->actingAs($user)
        ->postJson(
            feedbackEndpoint($message),
            [
                'rating' => 'positive',
            ]
        )
        ->assertStatus(500);
});

it('validates the rating', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => MentorMessageRole::ASSISTANT,
    ]);

    $this->actingAs($user)
        ->postJson(
            feedbackEndpoint($message),
            [
                'rating' => 'invalid-rating',
            ]
        )
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['rating']);
});

it('validates the comment length', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => MentorMessageRole::ASSISTANT,
    ]);

    $this->actingAs($user)
        ->postJson(
            feedbackEndpoint($message),
            [
                'rating' => 'positive',
                'comment' => str_repeat('a', 5001),
            ]
        )
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['comment']);
});