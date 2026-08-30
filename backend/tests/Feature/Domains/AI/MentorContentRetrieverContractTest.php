<?php

use App\Domains\AI\RAG\Contracts\MentorContentRetriever;
use App\Domains\AI\RAG\DTOs\MentorRetrievedChunk;

it('defines the mentor content retriever contract', function () {
    $reflection = new ReflectionClass(MentorContentRetriever::class);

    expect($reflection->isInterface())
        ->toBeTrue();

    expect($reflection->hasMethod('retrieve'))
        ->toBeTrue();
});

it('defines the retrieve method with the expected parameters', function () {
    $reflection = new ReflectionClass(MentorContentRetriever::class);

    $method = $reflection->getMethod('retrieve');

    expect($method->getNumberOfParameters())
        ->toBe(4);

    $parameters = $method->getParameters();

    expect($parameters[0]->getName())
        ->toBe('query');

    expect($parameters[1]->getName())
        ->toBe('courseId');

    expect($parameters[2]->getName())
        ->toBe('lessonId');

    expect($parameters[3]->getName())
        ->toBe('limit');
});

it('defines optional course and lesson filters', function () {
    $reflection = new ReflectionClass(MentorContentRetriever::class);

    $method = $reflection->getMethod('retrieve');

    $parameters = $method->getParameters();

    expect($parameters[1]->allowsNull())
        ->toBeTrue();

    expect($parameters[2]->allowsNull())
        ->toBeTrue();
});

it('defines a default retrieval limit', function () {
    $reflection = new ReflectionClass(MentorContentRetriever::class);

    $method = $reflection->getMethod('retrieve');

    $limit = $method->getParameters()[3];

    expect($limit->isDefaultValueAvailable())
        ->toBeTrue();

    expect($limit->getDefaultValue())
        ->toBe(5);
});

it('returns an array of retrieved chunks', function () {
    $retriever = new class implements MentorContentRetriever {
        public function retrieve(
            string $query,
            ?string $courseId = null,
            ?string $lessonId = null,
            int $limit = 5,
        ): array {
            return [
                new MentorRetrievedChunk(
                    content: 'Positive fuel trim indicates additional fuel.',
                    sourceType: 'lesson',
                    sourceId: 'lesson-123',
                    title: 'Fuel Trim',
                    score: 0.95,
                ),
            ];
        }
    };

    $results = $retriever->retrieve(
        query: 'What does positive fuel trim mean?',
        courseId: 'course-123',
        lessonId: 'lesson-123',
    );

    expect($results)
        ->toHaveCount(1);

    expect($results[0])
        ->toBeInstanceOf(MentorRetrievedChunk::class);
});

it('supports an empty retrieval result', function () {
    $retriever = new class implements MentorContentRetriever {
        public function retrieve(
            string $query,
            ?string $courseId = null,
            ?string $lessonId = null,
            int $limit = 5,
        ): array {
            return [];
        }
    };

    $results = $retriever->retrieve(
        query: 'Something with no matching course content.',
    );

    expect($results)
        ->toBe([]);
});