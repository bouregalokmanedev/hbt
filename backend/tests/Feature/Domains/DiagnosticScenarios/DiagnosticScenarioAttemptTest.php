<?php

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Models\User;

it('attempt belongs to scenario', function () {
    $attempt = DiagnosticScenarioAttempt::factory()->create();

    expect($attempt->scenario)
        ->toBeInstanceOf(DiagnosticScenario::class);
});

it('attempt belongs to user', function () {
    $attempt = DiagnosticScenarioAttempt::factory()->create();

    expect($attempt->user)
        ->toBeInstanceOf(User::class);
});

it('attempt status is cast to enum', function () {
    $attempt = DiagnosticScenarioAttempt::factory()->create([
        'status' => DiagnosticScenarioAttemptStatus::IN_PROGRESS,
    ]);

    expect($attempt->status)
        ->toBe(DiagnosticScenarioAttemptStatus::IN_PROGRESS);
});

it('attempt stores score and passed state', function () {
    $attempt = DiagnosticScenarioAttempt::factory()->create([
        'score' => 84,
        'passed' => true,
    ]);

    expect($attempt->score)
        ->toBe(84)
        ->and($attempt->passed)
        ->toBeTrue();
});

it('attempt stores evidence as an array', function () {
    $attempt = DiagnosticScenarioAttempt::factory()->create([
        'evidence' => [
            'fault_identified' => 'fuel_pressure',
            'measurements' => [
                'pressure' => '2.8 bar',
            ],
        ],
    ]);

    expect($attempt->evidence)
        ->toBeArray()
        ->and($attempt->evidence['fault_identified'])
        ->toBe('fuel_pressure');
});