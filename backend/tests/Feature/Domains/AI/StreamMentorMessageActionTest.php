<?php

use App\Domains\AI\Actions\StreamMentorMessageAction;
use App\Domains\AI\Contracts\MentorAIProvider;
use App\Domains\AI\DTOs\MentorAIResponse;
use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\Models\MentorAIUsage;
use App\Domains\AI\DTOs\MentorAIStreamResponse;
use App\Domains\AI\Enums\MentorConversationStatus;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Enums\MentorMessageRole;
use App\Domains\AI\Models\MentorMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;


uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Fake streaming provider
|--------------------------------------------------------------------------
*/
final class FakeStreamingMentorAIProvider implements MentorAIProvider
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
                yield 'is ';
                yield 'the correction ';
                yield 'applied by the ECU.';
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
final class FailingStreamingMentorAIProvider implements MentorAIProvider
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

                throw new RuntimeException(
                    'Streaming provider failed.'
                );
            })(),
            provider: 'fake',
            model: 'fake-model',
            requestId: 'fake-request-id',
        );
    }
}
final class FakeStreamMentorAIProvider implements MentorAIProvider
{
    public bool $called = false;

    public ?MentorConversation $conversation = null;

    public ?MentorContext $context = null;

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

        $this->conversation = $conversation;
        $this->context = $context;
        $this->message = $message;

        return new MentorAIStreamResponse(
            chunks: $this->chunks(),
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

    private function chunks(): \Generator
    {
        yield 'Fuel ';
        yield 'trim ';
        yield 'represents ';
        yield 'fuel correction.';
    }
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function fakeStreamingProvider(): FakeStreamMentorAIProvider
{
    return app(MentorAIProvider::class);
}

function streamingAction(): StreamMentorMessageAction
{
    return app(StreamMentorMessageAction::class);
}

/*
|--------------------------------------------------------------------------
| Basic streaming
|--------------------------------------------------------------------------
*/

it('streams the mentor response', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $provider = new FakeStreamMentorAIProvider();

app()->instance(
    MentorAIProvider::class,
    $provider
);

expect(app(MentorAIProvider::class))
    ->toBe($provider);

$this->actingAs($user);

$stream = streamingAction()->execute(
    $conversation,
    'Explain fuel trim.',
);

   expect($stream)
    ->toBeInstanceOf(MentorAIStreamResponse::class);

expect(iterator_to_array($stream->chunks))
    ->toBe([
        'Fuel ',
        'trim ',
        'represents ',
        'fuel correction.',
    ]);
});

/*
|--------------------------------------------------------------------------
| Provider invocation
|--------------------------------------------------------------------------
*/

it('passes the conversation and message to the provider', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $provider = new FakeStreamMentorAIProvider();

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $this->actingAs($user);

    $stream = streamingAction()->execute(
        $conversation,
        'Explain positive fuel trim.',
    );

    iterator_to_array($stream->chunks);

    expect($provider->called)
        ->toBeTrue();

    expect($provider->conversation?->is($conversation))
        ->toBeTrue();

    expect($provider->message)
        ->toBe('Explain positive fuel trim.');
});

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/


it('requires authentication', function () {
    $conversation = MentorConversation::factory()->create();

    expect(fn () => streamingAction()->execute(
        $conversation,
        'Explain fuel trim.',
    ))->toThrow(
        \Illuminate\Auth\Access\AuthorizationException::class
    );
});

/*
|--------------------------------------------------------------------------
| Authorization
|--------------------------------------------------------------------------
*/

it('does not allow another user to stream a conversation', function () {
    $owner = User::factory()->create();

    $otherUser = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $owner->id,
    ]);

    $provider = new FakeStreamMentorAIProvider();

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $this->actingAs($otherUser);

    expect(fn () => streamingAction()->execute(
        $conversation,
        'Explain fuel trim.',
    ))->toThrow(
        \Illuminate\Auth\Access\AuthorizationException::class
    );

    expect($provider->called)
        ->toBeFalse();
});

/*
|--------------------------------------------------------------------------
| Conversation status
|--------------------------------------------------------------------------
*/

it('does not stream a closed conversation', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
        'status' => MentorConversationStatus::CLOSED,
    ]);

    $provider = new FakeStreamMentorAIProvider();

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $this->actingAs($user);

    expect(fn () => streamingAction()->execute(
        $conversation,
        'Explain fuel trim.',
    ))->toThrow(
        \Symfony\Component\HttpKernel\Exception\HttpException::class
    );

    expect($provider->called)
        ->toBeFalse();
});

/*
|--------------------------------------------------------------------------
| Context
|--------------------------------------------------------------------------
*/

it('builds and passes mentor context to the provider', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $provider = new FakeStreamMentorAIProvider();

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $this->actingAs($user);

    $stream = streamingAction()->execute(
        $conversation,
        'Explain closed loop fueling.',
    );

    iterator_to_array($stream->chunks);

    expect($provider->context)
        ->toBeInstanceOf(MentorContext::class);
});

/*
|--------------------------------------------------------------------------
| Provider failures
|--------------------------------------------------------------------------
*/

it('does not swallow provider exceptions', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $provider = new class implements MentorAIProvider {
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
            throw new RuntimeException(
                'Streaming provider failed.'
            );
        }
    };

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $this->actingAs($user);

    expect(fn () => iterator_to_array(
        streamingAction()->execute(
            $conversation,
            'Explain fuel trim.',
        )
    ))->toThrow(
        RuntimeException::class,
        'Streaming provider failed.'
    );
});

/*
|--------------------------------------------------------------------------
| Empty stream
|--------------------------------------------------------------------------
*/

it('supports an empty provider stream', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $provider = new class implements MentorAIProvider {
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
            return new MentorAIStreamResponse(
                chunks: new \ArrayIterator([]),
                provider: 'fake',
            );
        }
    };

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $this->actingAs($user);

    $stream = streamingAction()->execute(
        $conversation,
        'Explain fuel trim.',
    );

    expect(iterator_to_array($stream->chunks))
        ->toBe([]);
});

it('blocks streaming when the daily AI request limit is reached', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    config([
        'ai.limits.daily_requests' => 2,
        'ai.limits.monthly_requests' => 2000,
        'ai.limits.daily_tokens' => 100000,
        'ai.limits.monthly_tokens' => 1000000,
    ]);

    MentorAIUsage::factory()->count(2)->create([
        'user_id' => $user->id,
        'created_at' => now(),
        'total_tokens' => 100,
    ]);

    $provider = new FakeStreamMentorAIProvider();

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $this->actingAs($user);

    expect(fn () => streamingAction()->execute(
        $conversation,
        'Explain fuel trim.',
    ))->toThrow(
        \Symfony\Component\HttpKernel\Exception\HttpException::class
    );

    expect($provider->called)->toBeFalse();
});
it('records streaming AI usage after the stream completes', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    app()->instance(
        MentorAIProvider::class,
        new FakeStreamMentorAIProvider()
    );

    $this->actingAs($user);

    $stream = streamingAction()->execute(
        $conversation,
        'Explain fuel trim.',
    );

    expect(
        MentorAIUsage::where('user_id', $user->id)->count()
    )->toBe(0);

    iterator_to_array($stream->chunks);

    $usage = MentorAIUsage::where(
        'user_id',
        $user->id
    )->latest()->first();

    expect($usage)->not->toBeNull();

    expect($usage->request_type->value)
        ->toBe('stream');

    expect($usage->provider)
        ->toBe('fake');

    expect($usage->model)
        ->toBe('fake-model');

    expect($usage->input_tokens)
        ->toBe(10);

    expect($usage->output_tokens)
        ->toBe(20);

    expect($usage->total_tokens)
        ->toBe(30);

    expect($usage->successful)
        ->toBeTrue();
});
it('records failed streaming usage when the provider throws', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $provider = new class implements MentorAIProvider {
        public function respond(
            MentorConversation $conversation,
            \App\Domains\AI\DTOs\MentorContext $context,
            string $message,
        ): \App\Domains\AI\DTOs\MentorAIResponse {
            throw new RuntimeException('Not implemented.');
        }

        public function stream(
            MentorConversation $conversation,
            \App\Domains\AI\DTOs\MentorContext $context,
            string $message,
        ): \App\Domains\AI\DTOs\MentorAIStreamResponse {
            return new \App\Domains\AI\DTOs\MentorAIStreamResponse(
                chunks: (function (): \Generator {
                    yield 'Fuel ';

                    throw new RuntimeException(
                        'Streaming provider failed.'
                    );
                })(),
                provider: 'fake',
                model: 'fake-model',
            );
        }
    };

    app()->instance(
        MentorAIProvider::class,
        $provider
    );

    $this->actingAs($user);

    $stream = streamingAction()->execute(
        $conversation,
        'Explain fuel trim.',
    );

    expect(
        fn () => iterator_to_array($stream->chunks)
    )->toThrow(
        RuntimeException::class,
        'Streaming provider failed.'
    );

    $usage = MentorAIUsage::where(
        'user_id',
        $user->id
    )->latest()->first();

    expect($usage)->not->toBeNull();

    expect($usage->request_type->value)
        ->toBe('stream');

    expect($usage->successful)
        ->toBeFalse();

    expect($usage->failure_reason)
        ->toContain('Streaming provider failed.');
});
it('stores the user message before streaming', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    app()->instance(
        MentorAIProvider::class,
        new FakeStreamingMentorAIProvider()
    );

    $response = $this->actingAs($user);

    $stream = app(StreamMentorMessageAction::class)->execute(
        $conversation,
        'Explain fuel trim.',
    );

    expect(
        $conversation->messages()
            ->where('role', MentorMessageRole::USER)
            ->where('content', 'Explain fuel trim.')
            ->exists()
    )->toBeTrue();
});
it('stores the completed assistant response after streaming', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    app()->instance(
        MentorAIProvider::class,
        new FakeStreamingMentorAIProvider()
    );

    $stream = app(StreamMentorMessageAction::class)->execute(
        $conversation,
        'Explain fuel trim.',
    );

    iterator_to_array($stream->chunks);

    expect(
        $conversation->messages()
            ->where('role', MentorMessageRole::ASSISTANT)
            ->count()
    )->toBe(1);

    $assistantMessage = $conversation->messages()
        ->where('role', MentorMessageRole::ASSISTANT)
        ->first();

    expect($assistantMessage)->not->toBeNull();

    expect($assistantMessage->content)
        ->toBe('Fuel trim is the correction applied by the ECU.');
});

it('does not persist a partial assistant response when streaming fails', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    app()->instance(
        MentorAIProvider::class,
        new FailingStreamingMentorAIProvider()
    );

    $stream = app(StreamMentorMessageAction::class)->execute(
        $conversation,
        'Explain fuel trim.',
    );

    expect(fn () => iterator_to_array($stream->chunks))
        ->toThrow(RuntimeException::class);

    expect(
        $conversation->messages()
            ->where('role', MentorMessageRole::USER)
            ->count()
    )->toBe(1);

    expect(
        $conversation->messages()
            ->where('role', MentorMessageRole::ASSISTANT)
            ->count()
    )->toBe(0);
});