<?php

use App\Domains\AI\Contracts\MentorAIProvider;
use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Providers\OpenAIMentorAIProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;


uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function streamingProvider(): OpenAIMentorAIProvider
{
    return app(OpenAIMentorAIProvider::class);
}

function streamingConversation(): MentorConversation
{
    $user = \App\Models\User::factory()->create();

    return MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);
}

function streamingContext(
    \App\Models\User $user
): MentorContext {
    return app(
        \App\Domains\AI\Services\MentorContextService::class
    )->build(
        $user,
        null,
    );
}

function fakeOpenAIStream(
    string $body
): void {
    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response(
            $body,
            200,
            [
                'Content-Type' => 'text/event-stream',
            ]
        ),
    ]);
}

/*
|--------------------------------------------------------------------------
| Contract
|--------------------------------------------------------------------------
*/

it('implements the mentor AI provider contract', function () {
    $provider = streamingProvider();

    expect($provider)
        ->toBeInstanceOf(MentorAIProvider::class);
});

it('exposes a stream method', function () {
    $provider = streamingProvider();

    expect(method_exists($provider, 'stream'))
        ->toBeTrue();
});

/*
|--------------------------------------------------------------------------
| Streaming response
|--------------------------------------------------------------------------
*/

it('returns a traversable stream', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel \"}}]}\n\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"trim \"}}]}\n\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"represents \"}}]}\n\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"fuel correction.\"}}]}\n\n"
        . "data: [DONE]\n\n"
    );

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

expect($response)
    ->toBeInstanceOf(
        \App\Domains\AI\DTOs\MentorAIStreamResponse::class
    );

expect($response->chunks)
    ->toBeInstanceOf(Traversable::class);
});

/*
|--------------------------------------------------------------------------
| Stream content
|--------------------------------------------------------------------------
*/

it('streams assistant content chunks', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel \"}}]}\n\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"trim \"}}]}\n\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"represents \"}}]}\n\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"fuel correction.\"}}]}\n\n"
        . "data: [DONE]\n\n"
    );

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    expect($chunks)
        ->not->toBeEmpty();

    expect($chunks)
        ->toBe([
            'Fuel ',
            'trim ',
            'represents ',
            'fuel correction.',
        ]);
});

/*
|--------------------------------------------------------------------------
| Provider request
|--------------------------------------------------------------------------
*/

it('sends the correct streaming request to OpenAI', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel trim.\"}}]}\n\n"
        . "data: [DONE]\n\n"
    );

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    Http::assertSent(function ($request) {
        return $request->url()
            === 'https://api.openai.com/v1/chat/completions'
            && $request->method() === 'POST'
            && $request->data()['stream'] === true
            && $request->data()['model'] === 'gpt-4o-mini'
            && isset($request->data()['messages']);
    });
});

/*
|--------------------------------------------------------------------------
| Prompt handling
|--------------------------------------------------------------------------
*/

it('includes the mentor prompt in the streaming request', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel trim.\"}}]}\n\n"
        . "data: [DONE]\n\n"
    );

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    Http::assertSent(function ($request) {
        $messages = $request->data()['messages'] ?? [];

        return is_array($messages)
            && count($messages) > 0;
    });
});

/*
|--------------------------------------------------------------------------
| Empty chunks
|--------------------------------------------------------------------------
*/

it('ignores streaming chunks without content', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{}}]}\n\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel trim.\"}}]}\n\n"
        . "data: {\"choices\":[{\"delta\":{}}]}\n\n"
        . "data: [DONE]\n\n"
    );

   $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    expect($chunks)
        ->not->toBeEmpty();

    expect($chunks)
        ->toBe([
            'Fuel trim.',
        ]);

    expect($chunks)
        ->each
        ->toBeString();
});

/*
|--------------------------------------------------------------------------
| DONE event
|--------------------------------------------------------------------------
*/

it('ignores the done event', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel trim.\"}}]}\n\n"
        . "data: [DONE]\n\n"
    );

   $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    expect($chunks)
        ->toBe([
            'Fuel trim.',
        ]);
});

/*
|--------------------------------------------------------------------------
| Invalid SSE events
|--------------------------------------------------------------------------
*/

it('ignores invalid streaming events', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "event: message\n\n"
        . "data: invalid-json\n\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel trim.\"}}]}\n\n"
        . "data: [DONE]\n\n"
    );

   $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    expect($chunks)
        ->toBe([
            'Fuel trim.',
        ]);
});

/*
|--------------------------------------------------------------------------
| Provider failure
|--------------------------------------------------------------------------
*/

it('throws when the streaming provider request fails', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response([
            'error' => [
                'message' => 'OpenAI streaming request failed.',
            ],
        ], 500),
    ]);

    expect(function () use (
        $conversation,
        $context,
    ) {
        iterator_to_array(
            streamingProvider()->stream(
                $conversation,
                $context,
                'Explain fuel trim.',
            )
        );
    })->toThrow(RuntimeException::class);
});

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

it('uses the configured OpenAI model', function () {
    config([
        'services.openai.model' => 'gpt-test-model',
    ]);

    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel trim.\"}}]}\n\n"
        . "data: [DONE]\n\n"
    );

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    Http::assertSent(function ($request) {
        return $request->data()['model']
            === 'gpt-test-model';
    });
});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

it('sends the configured OpenAI API key', function () {
    config([
        'services.openai.key' => 'test-openai-key',
    ]);

    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel trim.\"}}]}\n\n"
        . "data: [DONE]\n\n"
    );

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    Http::assertSent(function ($request) {
        return $request->hasHeader(
            'Authorization',
            'Bearer test-openai-key'
        );
    });
});
it('handles SSE events split across HTTP chunks', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response(
            "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel trim.\"}}]}\n\n"
            . "data: [DONE]\n\n",
            200,
            [
                'Content-Type' => 'text/event-stream',
            ]
        ),
    ]);

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    expect($chunks)->toBe([
        'Fuel trim.',
    ]);
});
it('handles CRLF SSE events', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel \"}}]}\r\n\r\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"trim.\"}}]}\r\n\r\n"
        . "data: [DONE]\r\n\r\n"
    );

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    expect($chunks)->toBe([
        'Fuel ',
        'trim.',
    ]);
});
it('handles SSE events using LF line endings', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel trim.\"}}]}\n\n"
        . "data: [DONE]\n\n"
    );

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    expect($chunks)->toBe([
        'Fuel trim.',
    ]);
});
it('ignores SSE events without assistant content', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[]}\n\n"
        . "data: {\"choices\":[{\"delta\":{}}]}\n\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\n\n"
        . "data: [DONE]\n\n"
    );

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    expect($chunks)->toBe([
        'Hello',
    ]);
});
it('supports CRLF SSE line endings', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"choices\":[{\"delta\":{\"content\":\"Fuel \"}}]}\r\n\r\n"
        . "data: {\"choices\":[{\"delta\":{\"content\":\"trim.\"}}]}\r\n\r\n"
        . "data: [DONE]\r\n\r\n"
    );

    $response = streamingProvider()->stream(
    $conversation,
    $context,
    'Explain fuel trim.',
);

$chunks = iterator_to_array(
    $response->chunks
);

    expect($chunks)->toBe([
        'Fuel ',
        'trim.',
    ]);
});
it('captures usage metadata from the streaming response', function () {
    $user = \App\Models\User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $context = streamingContext($user);

    fakeOpenAIStream(
        "data: {\"model\":\"gpt-4o-mini\",\"choices\":[{\"delta\":{\"content\":\"Fuel trim.\"},\"finish_reason\":null}]}\n\n"
        . "data: {\"model\":\"gpt-4o-mini\",\"choices\":[{\"delta\":{},\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":25,\"completion_tokens\":15,\"total_tokens\":40}}\n\n"
        . "data: [DONE]\n\n"
    );

    $response = streamingProvider()->stream(
        $conversation,
        $context,
        'Explain fuel trim.',
    );

    iterator_to_array($response->chunks);

    expect($response->model)
        ->toBe('gpt-4o-mini');

    expect($response->finishReason)
        ->toBe('stop');

    expect($response->promptTokens)
        ->toBe(25);

    expect($response->completionTokens)
        ->toBe(15);

    expect($response->totalTokens)
        ->toBe(40);

    expect($response->responseTimeMs)
        ->toBeInt();
});