<?php

use App\Domains\AI\Services\MentorDomainResponseValidatorService;

function mentorDomainResponseValidatorService(): MentorDomainResponseValidatorService
{
    return app(MentorDomainResponseValidatorService::class);
}

it('allows a normal educational response', function () {
    $result = mentorDomainResponseValidatorService()->validate(
        'Fuel trim represents the ECU correction applied to maintain the correct air-fuel mixture.'
    );

    expect($result->allowed)
        ->toBeTrue()
        ->and($result->action)
        ->toBe('allow');
});

it('allows a normal automotive diagnostic response', function () {
    $result = mentorDomainResponseValidatorService()->validate(
        'A misfire can be investigated by checking ignition, injector operation, fuel pressure, and compression.'
    );

    expect($result->allowed)
        ->toBeTrue()
        ->and($result->action)
        ->toBe('allow');
});

it('allows an engine diagnostic response containing measurement guidance', function () {
    $result = mentorDomainResponseValidatorService()->validate(
        'Check the MAF sensor signal with a scan tool and compare the measured airflow against the expected engine operating conditions.'
    );

    expect($result->allowed)
        ->toBeTrue();
});

it('rejects an empty response', function () {
    $result = mentorDomainResponseValidatorService()->validate('');

    expect($result->allowed)
        ->toBeFalse()
        ->and($result->action)
        ->toBe('block')
        ->and($result->reason)
        ->not->toBeNull();
});

it('rejects a whitespace-only response', function () {
    $result = mentorDomainResponseValidatorService()->validate(
        '     '
    );

    expect($result->allowed)
        ->toBeFalse();
});

it('rejects a response that is too short', function () {
    $result = mentorDomainResponseValidatorService()->validate(
        'Okay'
    );

    expect($result->allowed)
        ->toBeFalse();
});

it('rejects a generic unrelated response', function () {
    $result = mentorDomainResponseValidatorService()->validate(
        'The capital of France is Paris and it is a famous European city.'
    );

    expect($result->allowed)
        ->toBeFalse();
});

it('rejects a generic non-answer response', function () {
    $result = mentorDomainResponseValidatorService()->validate(
        'I cannot help with that request because I do not have enough information.'
    );

    expect($result->allowed)
        ->toBeFalse();
});

it('provides a safe response when the domain validation fails', function () {
    $result = mentorDomainResponseValidatorService()->validate(
        'Here is some information about European geography and historical landmarks.'
    );

    expect($result->allowed)
        ->toBeFalse()
        ->and($result->safeResponse)
        ->toBe(
            'I can help with HBTTronics educational and automotive learning topics. Please ask a course, lesson, or automotive diagnostic question.'
        );
});