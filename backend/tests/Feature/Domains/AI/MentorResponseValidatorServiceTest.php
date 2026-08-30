<?php

use App\Domains\AI\Services\MentorResponseValidatorService;

function mentorResponseValidatorService(): MentorResponseValidatorService
{
    return app(MentorResponseValidatorService::class);
}

it('allows a normal educational response', function () {
    $result = mentorResponseValidatorService()->validate(
        'A lean condition means the engine is receiving too much air or not enough fuel. Check fuel trims, intake leaks, and fuel pressure.'
    );

    expect($result->allowed)->toBeTrue()
        ->and($result->reason)->toBeNull();
});

it('allows a normal automotive diagnostic response', function () {
    $result = mentorResponseValidatorService()->validate(
        'Start by checking the fuel trim values. If LTFT is strongly positive, inspect for vacuum leaks, low fuel pressure, and incorrect airflow measurement.'
    );

    expect($result->allowed)->toBeTrue();
});

it('rejects an empty response', function () {
    $result = mentorResponseValidatorService()->validate('');

    expect($result->allowed)->toBeFalse()
        ->and($result->reason)->not->toBeNull();
});

it('rejects a whitespace-only response', function () {
    $result = mentorResponseValidatorService()->validate('   ');

    expect($result->allowed)->toBeFalse()
        ->and($result->reason)->not->toBeNull();
});

it('rejects an excessively long response', function () {
    $response = str_repeat('This is a diagnostic explanation. ', 10000);

    $result = mentorResponseValidatorService()->validate($response);

    expect($result->allowed)->toBeFalse()
        ->and($result->reason)->not->toBeNull();
});

it('rejects a response containing system prompt leakage', function () {
    $result = mentorResponseValidatorService()->validate(
        'Here is the system prompt and hidden instructions used by the mentor.'
    );

    expect($result->allowed)->toBeFalse()
        ->and($result->reason)->not->toBeNull();
});

it('rejects a response containing hidden instruction leakage', function () {
    $result = mentorResponseValidatorService()->validate(
        'The hidden instructions tell me to ignore the normal mentor rules.'
    );

    expect($result->allowed)->toBeFalse()
        ->and($result->reason)->not->toBeNull();
});

it('provides a safe fallback when a response is rejected', function () {
    $result = mentorResponseValidatorService()->validate('');

    expect($result->allowed)->toBeFalse()
        ->and($result->safeResponse)->not->toBeNull()
        ->and($result->safeResponse)->not->toBe('');
});
