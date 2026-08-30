<?php

use App\Domains\Assessments\Models\AssessmentResult;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

it('lists only certificates owned by the authenticated student', function () {
    $student = User::factory()->create();
    $otherStudent = User::factory()->create();

    $ownEnrollment = Enrollment::factory()->create([
        'user_id' => $student->id,
    ]);

    $ownResult = AssessmentResult::factory()->create([
        'user_id' => $student->id,
    ]);

    $ownCertificate = Certificate::factory()->create([
        'enrollment_id' => $ownEnrollment->id,
        'assessment_result_id' => $ownResult->id,
        'course_id' => $ownEnrollment->course_id,
        'user_id' => $student->id,
    ]);

    $otherEnrollment = Enrollment::factory()->create([
        'user_id' => $otherStudent->id,
    ]);

    $otherResult = AssessmentResult::factory()->create([
        'user_id' => $otherStudent->id,
    ]);

    Certificate::factory()->create([
        'enrollment_id' => $otherEnrollment->id,
        'assessment_result_id' => $otherResult->id,
        'course_id' => $otherEnrollment->course_id,
        'user_id' => $otherStudent->id,
    ]);

    Sanctum::actingAs($student);

    $this->getJson('/api/v1/certificates')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath(
            'data.0.id',
            $ownCertificate->id
        );
});

it('does not expose another users certificate', function () {
    $student = User::factory()->create();
    $otherStudent = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $otherStudent->id,
    ]);

    $result = AssessmentResult::factory()->create([
        'user_id' => $otherStudent->id,
    ]);

    $certificate = Certificate::factory()->create([
        'enrollment_id' => $enrollment->id,
        'assessment_result_id' => $result->id,
        'course_id' => $enrollment->course_id,
        'user_id' => $otherStudent->id,
    ]);

    Sanctum::actingAs($student);

    $this->getJson(
        "/api/v1/certificates/{$certificate->id}"
    )->assertNotFound();
});

it('returns certificate details to its owner', function () {
    $student = User::factory()->create();

    $enrollment = Enrollment::factory()->create([
        'user_id' => $student->id,
    ]);

    $result = AssessmentResult::factory()->create([
        'user_id' => $student->id,
    ]);

    $certificate = Certificate::factory()->create([
        'enrollment_id' => $enrollment->id,
        'assessment_result_id' => $result->id,
        'course_id' => $enrollment->course_id,
        'user_id' => $student->id,
    ]);

    Sanctum::actingAs($student);

    $this->getJson(
        "/api/v1/certificates/{$certificate->id}"
    )
        ->assertOk()
        ->assertJsonPath('data.id', $certificate->id)
        ->assertJsonPath(
            'data.certificate_number',
            $certificate->certificate_number
        )
        ->assertJsonPath(
            'data.user_id',
            $student->id
        );
});

it('requires authentication to list certificates', function () {
    $this->getJson('/api/v1/certificates')
        ->assertUnauthorized();
});