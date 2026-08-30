<?php

namespace App\Domains\AI\RAG\DTOs;

final readonly class MentorRetrievedChunk
{
    public function __construct(
        public string $content,
        public string $sourceType,
        public string|int $sourceId,
        public ?string $title = null,
        public ?float $score = null,
        public array $metadata = [],
    ) {
    }

    public function toArray(): array
    {
        return [
            'content' => $this->content,
            'source_type' => $this->sourceType,
            'source_id' => $this->sourceId,
            'title' => $this->title,
            'score' => $this->score,
            'metadata' => $this->metadata,
        ];
    }
}