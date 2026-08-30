<?php

namespace App\Domains\AI\Providers;

use App\Domains\AI\Contracts\MentorAIProvider;
use App\Domains\AI\DTOs\MentorAIResponse;
use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Services\MentorPromptService;
use App\Domains\AI\DTOs\MentorAIStreamResponse;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Traversable;

final class OpenAIMentorAIProvider implements MentorAIProvider
{
    public function __construct(
        private readonly MentorPromptService $promptService,
    ) {
    }

    public function respond(
        MentorConversation $conversation,
        MentorContext $context,
        string $message,
    ): MentorAIResponse {
        $prompt = $this->promptService->build(
            $conversation,
            $context,
            $message,
        );

        $startedAt = microtime(true);

        $response = Http::withToken(
            config('services.openai.key')
        )->post(
            config(
                'services.openai.url',
                'https://api.openai.com/v1/chat/completions'
            ),
            [
                'model' => config(
                    'services.openai.model',
                    'gpt-4o-mini'
                ),
                'messages' => $prompt->toArray(),
            ]
        );

        $responseTimeMs = (int) round(
            (microtime(true) - $startedAt) * 1000
        );

        if ($response->failed()) {
            throw new RuntimeException(
                $response->json('error.message')
                    ?? 'OpenAI mentor provider request failed.'
            );
        }

        $content = $response->json(
            'choices.0.message.content'
        );

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException(
                'OpenAI mentor provider returned an invalid response.'
            );
        }

        return new MentorAIResponse(
            content: $content,
            provider: 'openai',
            model: $response->json('model'),
            requestId: $response->header('x-request-id'),
            finishReason: $response->json(
                'choices.0.finish_reason'
            ),
            promptTokens: $response->json(
                'usage.prompt_tokens'
            ),
            completionTokens: $response->json(
                'usage.completion_tokens'
            ),
            totalTokens: $response->json(
                'usage.total_tokens'
            ),
            responseTimeMs: $responseTimeMs,
        );
    }

  public function stream(
    MentorConversation $conversation,
    MentorContext $context,
    string $message,
): MentorAIStreamResponse {
    $prompt = $this->promptService->build(
        $conversation,
        $context,
        $message,
    );

    $startedAt = microtime(true);

    $response = Http::withToken(
        config('services.openai.key')
    )->withOptions([
        'stream' => true,
    ])->post(
        config(
            'services.openai.url',
            'https://api.openai.com/v1/chat/completions'
        ),
        [
            'model' => config(
                'services.openai.model',
                'gpt-4o-mini'
            ),

            'messages' => $prompt->toArray(),

            'stream' => true,

            'stream_options' => [
                'include_usage' => true,
            ],
        ]
    );

    if ($response->failed()) {
        throw new RuntimeException(
            $response->json('error.message')
                ?? 'OpenAI mentor streaming request failed.'
        );
    }

    $result = new MentorAIStreamResponse(
        chunks: new \EmptyIterator(),
        provider: 'openai',
        model: null,
        requestId: $response->header('x-request-id'),
    );

    $result->chunks = $this->streamChunks(
        body: $response->toPsrResponse()->getBody(),
        result: $result,
        startedAt: $startedAt,
    );

    return $result;
}

/**
 * @return \Generator<int, string>
 */
private function streamChunks(
    mixed $body,
    MentorAIStreamResponse $result,
    float $startedAt,
): \Generator {
    $buffer = '';

    while (! $body->eof()) {
        $chunk = $body->read(8192);

        if ($chunk === '') {
            continue;
        }

        $buffer .= $chunk;

        while (($separatorPosition = $this->findSseSeparator($buffer)) !== false) {
            $event = substr(
                $buffer,
                0,
                $separatorPosition
            );

            $separatorLength = $this->getSseSeparatorLength(
                $buffer,
                $separatorPosition
            );

            $buffer = substr(
                $buffer,
                $separatorPosition + $separatorLength
            );

            foreach (
                $this->parseStreamingEvent(
                    $event,
                    $result
                ) as $content
            ) {
                yield $content;
            }
        }
    }

    if (trim($buffer) !== '') {
        foreach (
            $this->parseStreamingEvent(
                $buffer,
                $result
            ) as $content
        ) {
            yield $content;
        }
    }

    $result->responseTimeMs = (int) round(
        (microtime(true) - $startedAt) * 1000
    );
}

/**
 * Find the next SSE event separator.
 */
private function findSseSeparator(string $buffer): int|false
{
    $positions = array_filter([
        strpos($buffer, "\r\n\r\n"),
        strpos($buffer, "\n\n"),
        strpos($buffer, "\r\r"),
    ], static fn ($position) => $position !== false);

    if ($positions === []) {
        return false;
    }

    return min($positions);
}

/**
 * Determine the length of the SSE separator.
 */
private function getSseSeparatorLength(
    string $buffer,
    int $position,
): int {
    if (substr($buffer, $position, 4) === "\r\n\r\n") {
        return 4;
    }

    if (substr($buffer, $position, 2) === "\n\n") {
        return 2;
    }

    return 2;
}

/**
 * Parse Server-Sent Events returned by OpenAI.
 *
 * @return array<int, string>
 */
private function parseStreamingEvent(
    string $chunk,
    MentorAIStreamResponse $result,
): array {
    $contents = [];

    $lines = preg_split(
        "/\r\n|\r|\n/",
        $chunk
    );

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '') {
            continue;
        }

        if (! str_starts_with($line, 'data:')) {
            continue;
        }

        $data = trim(
            substr($line, strlen('data:'))
        );

        if ($data === '[DONE]') {
            continue;
        }

        $decoded = json_decode(
            $data,
            true
        );

        if (! is_array($decoded)) {
            continue;
        }

        if (
            isset($decoded['model'])
            && is_string($decoded['model'])
        ) {
            $result->model = $decoded['model'];
        }

        $finishReason =
            $decoded['choices'][0]['finish_reason']
            ?? null;

        if (is_string($finishReason)) {
            $result->finishReason = $finishReason;
        }

        $usage = $decoded['usage'] ?? null;

        if (is_array($usage)) {
            if (isset($usage['prompt_tokens'])) {
                $result->promptTokens =
                    (int) $usage['prompt_tokens'];
            }

            if (isset($usage['completion_tokens'])) {
                $result->completionTokens =
                    (int) $usage['completion_tokens'];
            }

            if (isset($usage['total_tokens'])) {
                $result->totalTokens =
                    (int) $usage['total_tokens'];
            }
        }

        $content =
            $decoded['choices'][0]['delta']['content']
            ?? null;

        if (
            is_string($content)
            && $content !== ''
        ) {
            $contents[] = $content;
        }
    }

    return $contents;
}
}