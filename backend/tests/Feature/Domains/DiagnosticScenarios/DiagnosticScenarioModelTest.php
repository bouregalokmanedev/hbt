<?php

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Models\Course;

it('scenario belongs to a course', function () {
    $scenario = DiagnosticScenario::factory()->create();

    expect($scenario->course)
        ->toBeInstanceOf(Course::class);
});

it('scenario uses a uuid primary key', function () {
    $scenario = DiagnosticScenario::factory()->create();

    expect($scenario->getKey())
        ->toBeString()
        ->and($scenario->incrementing)
        ->toBeFalse();
});

it('scenario status is cast to enum', function () {
    $scenario = DiagnosticScenario::factory()->create([
        'status' => DiagnosticScenarioStatus::DRAFT,
    ]);

    expect($scenario->status)
        ->toBe(DiagnosticScenarioStatus::DRAFT);
});

it('scenario defaults to draft', function () {
    $scenario = DiagnosticScenario::factory()->create();

    expect($scenario->status)
        ->toBe(DiagnosticScenarioStatus::DRAFT);
});

it('course has diagnostic scenarios', function () {
    $course = Course::factory()->create();

    DiagnosticScenario::factory()
        ->count(2)
        ->create([
            'course_id' => $course->id,
        ]);

    expect($course->diagnosticScenarios)
        ->toHaveCount(2);
});