<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('issues a certificate when an assessment result is passed', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $enrollment->course_id,
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::PASSED,
        'score' => 85,
        'passed' => true,
    ]);

    $result = AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $user->id,
        'score' => 85,
        'passed' => true,
    ]);

    // Replace this with your actual certificate issuing action/event.
    app(\App\Domains\Certificates\Actions\IssueCertificateAction::class)
        ->execute($result);

    $certificate = Certificate::query()->sole();

    expect($certificate->assessment_result_id)
        ->toBe($result->id)
        ->and($certificate->enrollment_id)
        ->toBe($enrollment->id)
        ->and($certificate->course_id)
        ->toBe($enrollment->course_id)
        ->and($certificate->user_id)
        ->toBe($user->id)
        ->and($certificate->recipient_name)
        ->toBe($user->full_name)
        ->and($certificate->course_title)
        ->toBe($enrollment->course->title);
});

it('does not issue a certificate for a failed assessment', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $enrollment->course_id,
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::FAILED,
        'score' => 60,
        'passed' => false,
    ]);

    $result = AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $user->id,
        'score' => 60,
        'passed' => false,
    ]);

    expect(fn () => app(
        \App\Domains\Certificates\Actions\IssueCertificateAction::class
    )->execute($result))
        ->toThrow(
            \LogicException::class,
            'A certificate can only be issued for a passed assessment.'
        );

    expect(Certificate::query()->count())
        ->toBe(0);
});

it('does not issue a certificate merely because the enrollment is completed', function () {
    $enrollment = Enrollment::factory()->completed()->create();

    expect(Certificate::query()->count())
        ->toBe(0);
});

it('issues only one certificate for the same passed assessment result', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $enrollment->course_id,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::PASSED,
        'score' => 90,
        'passed' => true,
    ]);

    $result = AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $user->id,
        'score' => 90,
        'passed' => true,
    ]);

    $action = app(
        \App\Domains\Certificates\Actions\IssueCertificateAction::class
    );

    $action->execute($result);
    $action->execute($result);

    expect(Certificate::query()->count())
        ->toBe(1);
});

it('stores the passed assessment result on the certificate', function () {
    $user = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $enrollment->course_id,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::PASSED,
        'passed' => true,
        'score' => 92,
    ]);

    $result = AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $user->id,
        'passed' => true,
        'score' => 92,
    ]);

    app(\App\Domains\Certificates\Actions\IssueCertificateAction::class)
        ->execute($result);

    $certificate = Certificate::query()->sole();

    expect($certificate->assessment_result_id)
        ->toBe($result->id);
});