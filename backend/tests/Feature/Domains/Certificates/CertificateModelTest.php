<?php

use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\Assessments\Models\Assessment;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('belongs to an enrollment', function () {
    $enrollment = Enrollment::factory()->create();

    $result = AssessmentResult::factory()->create([
        'user_id' => $enrollment->user_id,
    ]);

    $certificate = Certificate::factory()->create([
        'enrollment_id' => $enrollment->id,
        'assessment_result_id' => $result->id,
        'course_id' => $enrollment->course_id,
        'user_id' => $enrollment->user_id,
    ]);

    expect($certificate->enrollment)
        ->toBeInstanceOf(Enrollment::class)
        ->and($certificate->enrollment->id)
        ->toBe($enrollment->id);
});

it('belongs to an assessment result', function () {
  $assessment = Assessment::factory()->create();

$result = AssessmentResult::factory()->create([
    'assessment_id' => $assessment->id,
    'passed' => true,
]);

$certificate = Certificate::factory()->create([
    'assessment_result_id' => $result->id,
]);

expect($certificate->assessmentResult->is($result))->toBeTrue();

    expect($certificate->assessmentResult)
        ->toBeInstanceOf(AssessmentResult::class)
        ->and($certificate->assessmentResult->id)
        ->toBe($result->id);
});

it('belongs to a course', function () {
    $course = Course::factory()->create();

    $certificate = Certificate::factory()->create([
        'course_id' => $course->id,
    ]);

    expect($certificate->course)
        ->toBeInstanceOf(Course::class)
        ->and($certificate->course->id)
        ->toBe($course->id);
});

it('belongs to a user', function () {
    $user = User::factory()->create();

    $certificate = Certificate::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($certificate->user)
        ->toBeInstanceOf(User::class)
        ->and($certificate->user->id)
        ->toBe($user->id);
});

it('generates a certificate number automatically', function () {
    $certificate = Certificate::factory()->create();

    expect($certificate->certificate_number)
        ->not->toBeNull()
        ->toStartWith('HBT-');
});

it('casts issued_at to datetime', function () {
    $certificate = Certificate::factory()->create([
        'issued_at' => now(),
    ]);

    expect($certificate->issued_at)
        ->toBeInstanceOf(\Illuminate\Support\Carbon::class);
});

it('does not allow two certificates for the same assessment result', function () {
    $result = AssessmentResult::factory()->create();

    Certificate::factory()->create([
        'assessment_result_id' => $result->id,
    ]);

    expect(fn () => Certificate::factory()->create([
        'assessment_result_id' => $result->id,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});