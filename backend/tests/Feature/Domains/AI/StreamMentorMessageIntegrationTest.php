<?php

use App\Domains\AI\Contracts\MentorAIProvider;
use App\Domains\AI\DTOs\MentorAIResponse;
use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\Models\MentorConversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Domains\AI\DTOs\MentorAIStreamResponse;
use Illuminate\Support\Facades\Http;


uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Fake provider used to verify the complete application pipeline
|--------------------------------------------------------------------------
*/

final class FakeStreamingIntegrationProvider implements MentorAIProvider
{
    public function respond(
        MentorConversation $conversation,
        MentorContext $context,
        string $message,
    ): MentorAIResponse {
        return new MentorAIResponse(
            content: 'Fallback response.',
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
| Helpers
|--------------------------------------------------------------------------
*/

function integrationConversation(User $user): MentorConversation
{
    return MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);
}

/*
|--------------------------------------------------------------------------
| Complete HTTP streaming pipeline
|--------------------------------------------------------------------------
*/

it('streams a mentor response through the complete HTTP pipeline', function () {
    $user = User::factory()->create();

    $conversation = integrationConversation($user);

    app()->instance(
        MentorAIProvider::class,
        new FakeStreamingIntegrationProvider()
    );

    $response = $this->actingAs($user)
    ->post(
        "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
        [
            'message' => 'Explain fuel trim.',
        ]
    );

expect($response->getStatusCode())
    ->toBe(200);

    expect($response->headers->get('Content-Type'))
        ->toStartWith('text/event-stream');

    $content = $response->streamedContent();

   expect($content)
    ->toContain('data: {"type":"chunk","content":"Fuel "}')
    ->toContain('data: {"type":"chunk","content":"trim "}')
    ->toContain('data: {"type":"chunk","content":"represents "}')
    ->toContain('data: {"type":"chunk","content":"fuel correction."}')
    ->toContain('data: {"type":"done"}');
});

/*
|--------------------------------------------------------------------------
| Event ordering
|--------------------------------------------------------------------------
*/

it('sends the done event after all chunks', function () {
    $user = User::factory()->create();

    $conversation = integrationConversation($user);

    app()->instance(
        MentorAIProvider::class,
        new FakeStreamingIntegrationProvider()
    );

    $response = $this->actingAs($user)
        ->post(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => 'Explain fuel trim.',
            ]
        );

    $content = $response->streamedContent();

    $lastChunkPosition = strrpos(
        $content,
        'data: {"type":"chunk"'
    );

    $donePosition = strrpos(
        $content,
        'data: {"type":"done"}'
    );

    expect($lastChunkPosition)
        ->toBeInt();

    expect($donePosition)
        ->toBeInt();

    expect($donePosition)
        ->toBeGreaterThan($lastChunkPosition);
});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

it('does not expose the streaming endpoint to guests', function () {
    $user = User::factory()->create();

    $conversation = integrationConversation($user);

    $this->post(
        "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
        [
            'message' => 'Explain fuel trim.',
        ]
    )->assertUnauthorized();
});

/*
|--------------------------------------------------------------------------
| Ownership
|--------------------------------------------------------------------------
*/

it('does not allow another user to stream the conversation', function () {
    $owner = User::factory()->create();

    $otherUser = User::factory()->create();

    $conversation = integrationConversation($owner);

    $provider = new FakeStreamingIntegrationProvider();

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $this->actingAs($otherUser)
        ->post(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => 'Explain fuel trim.',
            ]
        )
        ->assertForbidden();
});

/*
|--------------------------------------------------------------------------
| Closed conversation
|--------------------------------------------------------------------------
*/

it('does not stream a closed conversation', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
        'status' => \App\Domains\AI\Enums\MentorConversationStatus::CLOSED,
    ]);

    app()->instance(
        MentorAIProvider::class,
        new FakeStreamingIntegrationProvider()
    );

    $this->actingAs($user)
        ->post(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => 'Explain fuel trim.',
            ]
        )
        ->assertStatus(422);
});

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

it('validates the streaming message before starting the stream', function () {
    $user = User::factory()->create();

    $conversation = integrationConversation($user);

    app()->instance(
        MentorAIProvider::class,
        new FakeStreamingIntegrationProvider()
    );

    $this->actingAs($user)
        ->postJson(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => '',
            ]
        )
        ->assertUnprocessable();
});

/*
|--------------------------------------------------------------------------
| Real OpenAI provider at HTTP boundary
|--------------------------------------------------------------------------
*/

it('streams OpenAI SSE data through the HTTP endpoint', function () {
    config([
        'services.openai.key' => 'test-openai-key',
        'services.openai.model' => 'gpt-test-model',
    ]);

    $user = User::factory()->create();

    $conversation = integrationConversation($user);

    /*
    |--------------------------------------------------------------------------
    | Fake the actual OpenAI SSE response
    |--------------------------------------------------------------------------
    |
    | Important:
    | This is intentionally an SSE payload rather than a normal JSON
    | response because OpenAIMentorAIProvider::stream() parses SSE.
    |
    */

    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response(
            implode("\n", [
                'data: {"choices":[{"delta":{"content":"Fuel "}}]}',
                'data: {"choices":[{"delta":{"content":"trim "}}]}',
                'data: {"choices":[{"delta":{"content":"represents "}}]}',
                'data: {"choices":[{"delta":{"content":"ECU correction."}}]}',
                'data: [DONE]',
                '',
            ]),
            200,
            [
                'Content-Type' => 'text/event-stream',
            ]
        ),
    ]);

    /*
    |--------------------------------------------------------------------------
    | Use the real OpenAI provider
    |--------------------------------------------------------------------------
    */

    app()->forgetInstance(MentorAIProvider::class);

    $response = $this->actingAs($user)
    ->post(
        "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
        [
            'message' => 'Explain fuel trim.',
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | Verify HTTP response
    |--------------------------------------------------------------------------
    */

    expect($response->getStatusCode())
    ->toBe(200);

    expect($response->headers->get('Content-Type'))
        ->toStartWith('text/event-stream');

    /*
    |--------------------------------------------------------------------------
    | Verify streamed content
    |--------------------------------------------------------------------------
    */

    $content = $response->streamedContent();

    expect($content)
        ->toContain('"type":"chunk"')
        ->toContain('"content":"Fuel "')
        ->toContain('"content":"trim "')
        ->toContain('"content":"represents "')
        ->toContain('"content":"ECU correction."')
        ->toContain('"type":"done"');

    /*
    |--------------------------------------------------------------------------
    | Verify OpenAI was actually called
    |--------------------------------------------------------------------------
    */

    Http::assertSent(function ($request) {
        return $request->url() ===
            'https://api.openai.com/v1/chat/completions'
            && $request->method() === 'POST'
            && $request->data()['stream'] === true
            && $request->data()['model'] === 'gpt-test-model';
    });
});