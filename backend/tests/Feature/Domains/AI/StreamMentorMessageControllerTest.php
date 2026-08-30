<?php

use App\Domains\AI\Contracts\MentorAIProvider;
use App\Domains\AI\DTOs\MentorAIResponse;
use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Http\Controllers\StreamMentorMessageController;
use App\Domains\AI\DTOs\MentorAIStreamResponse;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpFoundation\StreamedResponse;


uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Fake streaming provider
|--------------------------------------------------------------------------
*/

final class FakeControllerStreamingMentorAIProvider implements MentorAIProvider
{
    public bool $called = false;

    public ?string $message = null;

    public function respond(
        MentorConversation $conversation,
        MentorContext $context,
        string $message,
    ): MentorAIResponse {
        return new MentorAIResponse(
            content: 'Fake response.',
            provider: 'fake',
        );
    }

    public function stream(
    MentorConversation $conversation,
    MentorContext $context,
    string $message,
): MentorAIStreamResponse {
    $this->called = true;
    $this->message = $message;

    $chunks = (function (): \Generator {
        yield 'Fuel ';
        yield 'trim ';
        yield 'represents ';
        yield 'fuel correction.';
    })();

    return new MentorAIStreamResponse(
        chunks: $chunks,
        provider: 'fake',
        model: 'fake-model',
        requestId: 'fake-request-id',
    );
}
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function controllerStreamingProvider(): FakeControllerStreamingMentorAIProvider
{
    return app(MentorAIProvider::class);
}

function controllerStreamingConversation(
    ?User $user = null,
): MentorConversation {
    $user ??= User::factory()->create();

    return MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);
}

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

it('requires authentication', function () {
    $conversation = controllerStreamingConversation();

    $this->postJson(
        "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
        [
            'message' => 'Explain fuel trim.',
        ]
    )->assertUnauthorized();
});

/*
|--------------------------------------------------------------------------
| Streaming response
|--------------------------------------------------------------------------
*/

it('returns a streamed response', function () {
    $user = User::factory()->create();

    $conversation = controllerStreamingConversation($user);

    app()->instance(
        MentorAIProvider::class,
        new FakeControllerStreamingMentorAIProvider()
    );

    $response = $this->actingAs($user)
        ->post(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => 'Explain fuel trim.',
            ]
        );

    expect($response->baseResponse)
        ->toBeInstanceOf(StreamedResponse::class);
});

/*
|--------------------------------------------------------------------------
| SSE headers
|--------------------------------------------------------------------------
*/



it('returns the correct SSE headers', function () {
    $user = User::factory()->create();

    $conversation = controllerStreamingConversation($user);

    app()->instance(
        MentorAIProvider::class,
        new FakeControllerStreamingMentorAIProvider()
    );

    $response = $this->actingAs($user)
        ->post(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => 'Explain fuel trim.',
            ]
        );

    expect($response->headers->get('Content-Type'))
        ->toStartWith('text/event-stream');

    $cacheControl = $response->headers->get('Cache-Control');

    expect($cacheControl)
        ->toContain('no-cache')
        ->toContain('no-store')
        ->toContain('must-revalidate');

    $response->assertHeader(
        'Connection',
        'keep-alive'
    );

    $response->assertHeader(
        'X-Accel-Buffering',
        'no'
    );
});

/*
|--------------------------------------------------------------------------
| Stream chunks
|--------------------------------------------------------------------------
*/

it('streams assistant content chunks', function () {
    $user = User::factory()->create();

    $conversation = controllerStreamingConversation($user);

    $provider = new FakeControllerStreamingMentorAIProvider();

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $response = $this->actingAs($user)
        ->post(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => 'Explain fuel trim.',
            ]
        );

    $content = $response->streamedContent();

    expect($content)
        ->toContain('"type":"chunk"')
        ->toContain('"content":"Fuel "')
        ->toContain('"content":"trim "')
        ->toContain('"content":"represents "')
        ->toContain('"content":"fuel correction."');
});

/*
|--------------------------------------------------------------------------
| Done event
|--------------------------------------------------------------------------
*/

it('sends a done event after the stream finishes', function () {
    $user = User::factory()->create();

    $conversation = controllerStreamingConversation($user);

    app()->instance(
        MentorAIProvider::class,
        new FakeControllerStreamingMentorAIProvider()
    );

    $response = $this->actingAs($user)
        ->post(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => 'Explain fuel trim.',
            ]
        );

    $content = $response->streamedContent();

    expect($content)
        ->toContain('data: {"type":"done"}');
});

/*
|--------------------------------------------------------------------------
| Provider invocation
|--------------------------------------------------------------------------
*/


it('passes the message to the streaming provider', function () {
    $user = User::factory()->create();

    $conversation = controllerStreamingConversation($user);

    $provider = new FakeControllerStreamingMentorAIProvider();

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $response = $this->actingAs($user)
        ->post(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => 'Why is fuel trim positive?',
            ]
        );

    // Force Laravel/PHP to consume the streamed generator.
    $response->streamedContent();

    expect($provider->called)
        ->toBeTrue();

    expect($provider->message)
        ->toBe('Why is fuel trim positive?');
});

/*
|--------------------------------------------------------------------------
| Authorization
|--------------------------------------------------------------------------
*/

it('does not allow another user to stream a conversation', function () {
    $owner = User::factory()->create();

    $otherUser = User::factory()->create();

    $conversation = controllerStreamingConversation($owner);

    $provider = new FakeControllerStreamingMentorAIProvider();

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

    expect($provider->called)
        ->toBeFalse();
});

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

it('requires a message', function () {
    $user = User::factory()->create();

    $conversation = controllerStreamingConversation($user);

    app()->instance(
        MentorAIProvider::class,
        new FakeControllerStreamingMentorAIProvider()
    );

    $this->actingAs($user)
        ->postJson(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            []
        )
        ->assertUnprocessable();
});

it('rejects an empty message', function () {
    $user = User::factory()->create();

    $conversation = controllerStreamingConversation($user);

    app()->instance(
        MentorAIProvider::class,
        new FakeControllerStreamingMentorAIProvider()
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

it('rejects a non-string message', function () {
    $user = User::factory()->create();

    $conversation = controllerStreamingConversation($user);

    app()->instance(
        MentorAIProvider::class,
        new FakeControllerStreamingMentorAIProvider()
    );

    $this->actingAs($user)
        ->postJson(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => 12345,
            ]
        )
        ->assertUnprocessable();
});

it('rejects a message longer than 10000 characters', function () {
    $user = User::factory()->create();

    $conversation = controllerStreamingConversation($user);

    app()->instance(
        MentorAIProvider::class,
        new FakeControllerStreamingMentorAIProvider()
    );

    $this->actingAs($user)
        ->postJson(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => str_repeat('a', 10001),
            ]
        )
        ->assertUnprocessable();
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

    $provider = new FakeControllerStreamingMentorAIProvider();

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $this->actingAs($user)
        ->post(
            "/api/v1/mentor/conversations/{$conversation->id}/messages/stream",
            [
                'message' => 'Explain fuel trim.',
            ]
        )
        ->assertStatus(422);

    expect($provider->called)
        ->toBeFalse();
});