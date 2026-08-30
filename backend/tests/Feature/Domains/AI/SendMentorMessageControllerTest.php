<?php

use App\Domains\AI\Contracts\MentorAIProvider;
use App\Domains\AI\DTOs\MentorAIResponse;
use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\Enums\MentorConversationStatus;
use App\Domains\AI\DTOs\MentorAIStreamResponse;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Fake AI Provider
|--------------------------------------------------------------------------
*/

final class FakeControllerMentorAIProvider implements MentorAIProvider
{
    public function respond(
        MentorConversation $conversation,
        MentorContext $context,
        string $message,
    ): MentorAIResponse {
        return new MentorAIResponse(
            content: 'Fuel trim represents the correction the engine control unit makes to maintain the target air-fuel ratio.',
            provider: 'fake',
        );
    }

    public function stream(
    MentorConversation $conversation,
    MentorContext $context,
    string $message,
): MentorAIStreamResponse {
    return new MentorAIStreamResponse(
        chunks: (function (): \Generator {
            yield 'Fuel ';
            yield 'trim ';
            yield 'represents ';
            yield 'fuel correction.';
        })(),
        provider: 'fake',
        model: 'fake-model',
        requestId: 'fake-request-id',
        finishReason: 'stop',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        responseTimeMs: 100,
    );
}
}

/*
|--------------------------------------------------------------------------
| Setup
|--------------------------------------------------------------------------
*/

beforeEach(function () {
    app()->instance(
        MentorAIProvider::class,
        new FakeControllerMentorAIProvider(),
    );
});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

it('requires authentication to send mentor messages', function () {
    $conversation = MentorConversation::factory()->create();

    $this->postJson(
        "/api/v1/mentor/conversations/{$conversation->id}/messages",
        [
            'message' => 'Why is the engine running lean?',
        ]
    )->assertUnauthorized();
});

/*
|--------------------------------------------------------------------------
| Sending messages
|--------------------------------------------------------------------------
*/

it('sends a mentor message', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->postJson(
            "/api/v1/mentor/conversations/{$conversation->id}/messages",
            [
                'message' => 'Why is the engine running lean?',
            ]
        )
        ->assertCreated()
        ->assertJsonPath(
            'data.role',
            'assistant'
        )
        ->assertJsonPath(
            'data.content',
            'Fuel trim represents the correction the engine control unit makes to maintain the target air-fuel ratio.'
        );
});

it('stores the user message', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = 'What causes positive fuel trim?';

    $this->actingAs($user)
        ->postJson(
            "/api/v1/mentor/conversations/{$conversation->id}/messages",
            [
                'message' => $message,
            ]
        )
        ->assertCreated();

    expect(
        MentorMessage::query()
            ->where('mentor_conversation_id', $conversation->id)
            ->where('role', 'user')
            ->where('content', $message)
            ->exists()
    )->toBeTrue();
});

/*
|--------------------------------------------------------------------------
| Authorization / conversation state
|--------------------------------------------------------------------------
*/

it('does not allow another user to send a message', function () {
    $owner = User::factory()->create();

    $otherUser = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $owner->id,
    ]);

    $this->actingAs($otherUser)
        ->postJson(
            "/api/v1/mentor/conversations/{$conversation->id}/messages",
            [
                'message' => 'Give me the course answers.',
            ]
        )
        ->assertForbidden();

    expect(
        MentorMessage::query()
            ->where('mentor_conversation_id', $conversation->id)
            ->count()
    )->toBe(0);
});

it('does not allow messages in an inactive conversation', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
        'status' => MentorConversationStatus::CLOSED,
    ]);

    $this->actingAs($user)
        ->postJson(
            "/api/v1/mentor/conversations/{$conversation->id}/messages",
            [
                'message' => 'Can you help me?',
            ]
        )
        ->assertStatus(422);

    expect(
        MentorMessage::query()
            ->where('mentor_conversation_id', $conversation->id)
            ->count()
    )->toBe(0);
});

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

it('validates the message', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->postJson(
            "/api/v1/mentor/conversations/{$conversation->id}/messages",
            [
                'message' => '',
            ]
        )
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'message',
        ]);
});

/*
|--------------------------------------------------------------------------
| Response resource
|--------------------------------------------------------------------------
*/

it('returns the assistant message as the response resource', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->postJson(
            "/api/v1/mentor/conversations/{$conversation->id}/messages",
            [
                'message' => 'Explain closed loop fueling.',
            ]
        );

    $response
        ->assertCreated()
        ->assertJsonStructure([
            'data' => [
                'id',
                'mentor_conversation_id',
                'role',
                'content',
                'created_at',
            ],
        ])
        ->assertJsonPath(
            'data.role',
            'assistant'
        )
        ->assertJsonPath(
            'data.content',
            'Fuel trim represents the correction the engine control unit makes to maintain the target air-fuel ratio.'
        );
});