<?php

use App\Domains\AI\DTOs\MentorGuardrailResult;

it('creates an allow result', function () {
    $result = MentorGuardrailResult::allow();

    expect($result->allowed)
        ->toBeTrue()
        ->and($result->action)
        ->toBe('allow')
        ->and($result->reason)
        ->toBeNull()
        ->and($result->safeResponse)
        ->toBeNull();
});

it('creates a block result', function () {
    $result = MentorGuardrailResult::block(
        'Prompt injection detected.',
    );

    expect($result->allowed)
        ->toBeFalse()
        ->and($result->action)
        ->toBe('block')
        ->and($result->reason)
        ->toBe('Prompt injection detected.')
        ->and($result->safeResponse)
        ->toBeNull();
});

it('creates a block result with a safe response', function () {
    $result = MentorGuardrailResult::block(
        'Unsafe request.',
        'I can help with educational automotive topics.',
    );

    expect($result->allowed)
        ->toBeFalse()
        ->and($result->action)
        ->toBe('block')
        ->and($result->reason)
        ->toBe('Unsafe request.')
        ->and($result->safeResponse)
        ->toBe(
            'I can help with educational automotive topics.'
        );
});

it('creates a review result', function () {
    $result = MentorGuardrailResult::review(
        'The request requires additional review.',
    );

    expect($result->allowed)
        ->toBeFalse()
        ->and($result->action)
        ->toBe('review')
        ->and($result->reason)
        ->toBe(
            'The request requires additional review.'
        )
        ->and($result->safeResponse)
        ->toBeNull();
});

it('is immutable', function () {
    $reflection = new ReflectionClass(
        MentorGuardrailResult::class
    );

    expect($reflection->isReadOnly())
        ->toBeTrue();
});