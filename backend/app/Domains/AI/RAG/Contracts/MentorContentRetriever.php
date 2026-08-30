<?php

namespace App\Domains\AI\RAG\Contracts;

use App\Domains\AI\RAG\DTOs\MentorRetrievedChunk;

interface MentorContentRetriever
{
    /**
     * @return array<int, MentorRetrievedChunk>
     */
    public function retrieve(
        string $query,
        ?string $courseId = null,
        ?string $lessonId = null,
        int $limit = 5,
    ): array;
}