<?php

namespace App\Domains\AI\DTOs;

use Traversable;

final class MentorAIStreamResponse
{
    public function __construct(
        public Traversable $chunks,
        public ?string $provider = null,
        public ?string $model = null,
        public ?string $requestId = null,
        public ?string $finishReason = null,
        public ?int $promptTokens = null,
        public ?int $completionTokens = null,
        public ?int $totalTokens = null,
        public ?int $responseTimeMs = null,
    ) {
    }

    public function metadata(): array
    {
        return [
            'provider' => $this->provider,
            'model' => $this->model,
            'request_id' => $this->requestId,
            'finish_reason' => $this->finishReason,
            'prompt_tokens' => $this->promptTokens,
            'completion_tokens' => $this->completionTokens,
            'total_tokens' => $this->totalTokens,
            'response_time_ms' => $this->responseTimeMs,
        ];
    }

    public function toArray(): array
    {
        return [
            'metadata' => $this->metadata(),
        ];
    }
}