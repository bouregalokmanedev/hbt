<?php

use App\Domains\Assessments\Models\AssessmentResult;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('requires a unique assessment result per certificate', function () {
    $result = AssessmentResult::factory()->create();

    Certificate::factory()->create([
        'assessment_result_id' => $result->id,
    ]);

    expect(fn () => Certificate::factory()->create([
        'assessment_result_id' => $result->id,
    ]))->toThrow(\Illuminate\Database\QueryException::class);
});

it('deleting an assessment result deletes its certificate', function () {
    $result = AssessmentResult::factory()->create();

    $certificate = Certificate::factory()->create([
        'assessment_result_id' => $result->id,
    ]);

    expect(
        Certificate::query()
            ->whereKey($certificate->id)
            ->exists()
    )->toBeTrue();

    $result->delete();

    expect(
        Certificate::query()
            ->whereKey($certificate->id)
            ->exists()
    )->toBeFalse();
});

it('deleting an enrollment deletes its certificate', function () {
    $enrollment = Enrollment::factory()->create();

    $certificate = Certificate::factory()->create([
        'enrollment_id' => $enrollment->id,
    ]);

    $enrollment->delete();

    expect(
        Certificate::query()
            ->whereKey($certificate->id)
            ->exists()
    )->toBeFalse();
});

it('deleting a user deletes their certificates', function () {
    $user = User::factory()->create();

    $certificate = Certificate::factory()->create([
        'user_id' => $user->id,
    ]);

    $user->forceDelete();

    expect(
        Certificate::query()
            ->whereKey($certificate->id)
            ->exists()
    )->toBeFalse();
});