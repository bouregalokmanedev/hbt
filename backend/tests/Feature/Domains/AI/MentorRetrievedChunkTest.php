<?php

use App\Domains\AI\RAG\DTOs\MentorRetrievedChunk;

it('creates a retrieved chunk', function () {
    $chunk = new MentorRetrievedChunk(
        content: 'Positive fuel trim indicates the ECU is adding fuel.',
        sourceType: 'lesson',
        sourceId: 'lesson-123',
    );

    expect($chunk->content)
        ->toBe('Positive fuel trim indicates the ECU is adding fuel.');

    expect($chunk->sourceType)
        ->toBe('lesson');

    expect($chunk->sourceId)
        ->toBe('lesson-123');
});

it('supports optional title and score', function () {
    $chunk = new MentorRetrievedChunk(
        content: 'Fuel trim information.',
        sourceType: 'lesson',
        sourceId: 'lesson-123',
        title: 'Fuel Trim Diagnostics',
        score: 0.92,
    );

    expect($chunk->title)
        ->toBe('Fuel Trim Diagnostics');

    expect($chunk->score)
        ->toBe(0.92);
});

it('supports metadata', function () {
    $chunk = new MentorRetrievedChunk(
        content: 'Fuel trim information.',
        sourceType: 'lesson',
        sourceId: 'lesson-123',
        metadata: [
            'course_id' => 'course-123',
            'lesson_id' => 'lesson-123',
            'module_id' => 'module-123',
        ],
    );

    expect($chunk->metadata)
        ->toBe([
            'course_id' => 'course-123',
            'lesson_id' => 'lesson-123',
            'module_id' => 'module-123',
        ]);
});

it('serializes to an array', function () {
    $chunk = new MentorRetrievedChunk(
        content: 'Positive fuel trim indicates additional fuel is being added.',
        sourceType: 'lesson',
        sourceId: 'lesson-123',
        title: 'Fuel Trim',
        score: 0.95,
        metadata: [
            'course_id' => 'course-123',
        ],
    );

    expect($chunk->toArray())
        ->toBe([
            'content' => 'Positive fuel trim indicates additional fuel is being added.',
            'source_type' => 'lesson',
            'source_id' => 'lesson-123',
            'title' => 'Fuel Trim',
            'score' => 0.95,
            'metadata' => [
                'course_id' => 'course-123',
            ],
        ]);
});

it('supports integer source ids', function () {
    $chunk = new MentorRetrievedChunk(
        content: 'Diagnostic information.',
        sourceType: 'document',
        sourceId: 123,
    );

    expect($chunk->sourceId)
        ->toBe(123);
});

it('uses safe defaults for optional values', function () {
    $chunk = new MentorRetrievedChunk(
        content: 'Diagnostic information.',
        sourceType: 'lesson',
        sourceId: 'lesson-123',
    );

    expect($chunk->title)
        ->toBeNull();

    expect($chunk->score)
        ->toBeNull();

    expect($chunk->metadata)
        ->toBe([]);
});

it('is immutable', function () {
    $reflection = new ReflectionClass(MentorRetrievedChunk::class);

    expect($reflection->isReadOnly())
        ->toBeTrue();
});