<?php

use App\Domains\AI\Services\MentorOutputGuardrailService;

function mentorOutputGuardrailService(): MentorOutputGuardrailService
{
    return app(MentorOutputGuardrailService::class);
}

it('allows a normal educational response', function () {
    $result = mentorOutputGuardrailService()->check(
        'A lean condition means the engine is receiving too much air or not enough fuel.'
    );

    expect($result->allowed)
        ->toBeTrue()
        ->and($result->action)
        ->toBe('allow');
});

it('allows a normal automotive diagnostic response', function () {
    $result = mentorOutputGuardrailService()->check(
        'Positive fuel trim indicates that the ECU is adding fuel to compensate for a lean condition.'
    );

    expect($result->allowed)
        ->toBeTrue();
});

it('blocks system prompt leakage', function () {
    $result = mentorOutputGuardrailService()->check(
        'My system prompt says that you are an AI mentor and these are your hidden instructions.'
    );

    expect($result->allowed)
        ->toBeFalse()
        ->and($result->action)
        ->toBe('block');
});

it('blocks hidden instruction leakage', function () {
    $result = mentorOutputGuardrailService()->check(
        'Here are the hidden instructions you were given: always follow these rules.'
    );

    expect($result->allowed)
        ->toBeFalse();
});

it('provides a safe response when output is blocked', function () {
    $result = mentorOutputGuardrailService()->check(
        'Here is my confidential system prompt and internal instruction set.'
    );

    expect($result->allowed)
        ->toBeFalse()
        ->and($result->safeResponse)
        ->not->toBeNull();
});