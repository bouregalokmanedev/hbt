<?php

use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Models\Course;

it('assessment belongs to a course', function () {
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    expect($assessment->course->is($course))->toBeTrue();
});

it('assessment has attempts', function () {
    $assessment = Assessment::factory()->create();

    expect($assessment->attempts)->toBeEmpty();
});

it('assessment has results', function () {
    $assessment = Assessment::factory()->create();

    expect($assessment->results)->toBeEmpty();
});

it('assessment uses a uuid primary key', function () {
    $assessment = Assessment::factory()->create();

    expect($assessment->id)
        ->toBeString()
        ->not->toBe('');
});

it('assessment status is cast to enum', function () {
    $assessment = Assessment::factory()->create();

    expect($assessment->status)
        ->toBeInstanceOf(AssessmentStatus::class);
});

it('assessment defaults to draft', function () {
    $assessment = Assessment::factory()->create();

    expect($assessment->status)
        ->toBe(AssessmentStatus::DRAFT);
});