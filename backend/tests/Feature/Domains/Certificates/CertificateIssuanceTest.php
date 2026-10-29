<?php

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Enums\AssessmentMode;
use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Builds a course that is genuinely certifiable: published section, complete
 * section progress, an active enrollment and a published course-scoped
 * summative assessment.
 *
 * @return array{enrollment: Enrollment, assessment: Assessment, course: Course}
 */
function certificateCourse(User $user, array $assessmentOverrides = []): array
{
    $course = Course::factory()->create(['status' => 'published']);

    $section = Section::factory()->published()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    SectionProgress::factory()->create([
        'user_id' => $user->id,
        'section_id' => $section->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $assessment = Assessment::factory()->create(array_merge([
        'course_id' => $course->id,
        'status' => AssessmentStatus::PUBLISHED,
        'assessment_mode' => AssessmentMode::SUMMATIVE,
        'minimum_score' => 70,
        'is_required' => true,
        'published_at' => now(),
    ], $assessmentOverrides));

    return compact('enrollment', 'assessment', 'course');
}

it('issues a certificate when an assessment result is passed', function () {
    $user = User::factory()->create();

    ['enrollment' => $enrollment, 'assessment' => $assessment] = certificateCourse($user);

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

    ['assessment' => $assessment] = certificateCourse($user);

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

it('refuses to certify a section-scoped assessment', function () {
    $user = User::factory()->create();

    ['assessment' => $assessment, 'course' => $course] = certificateCourse($user);

    $section = Section::factory()->published()->create([
        'course_id' => $course->id,
        'position' => 2,
    ]);

    $assessment->update(['section_id' => $section->id]);

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

    expect(fn () => app(
        \App\Domains\Certificates\Actions\IssueCertificateAction::class
    )->execute($result))
        ->toThrow(
            \LogicException::class,
            'A certificate can only be issued for a course-scoped summative or final assessment.'
        );

    expect(Certificate::query()->count())->toBe(0);
});

it('refuses to certify when the course is not fully passed', function () {
    $user = User::factory()->create();

    ['assessment' => $assessment, 'course' => $course] = certificateCourse($user);

    // Remove the evidence that the course itself was completed.
    SectionProgress::query()
        ->where('user_id', $user->id)
        ->whereHas('section', fn ($query) => $query->where('course_id', $course->id))
        ->delete();

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

    expect(fn () => app(
        \App\Domains\Certificates\Actions\IssueCertificateAction::class
    )->execute($result))
        ->toThrow(
            \LogicException::class,
            'The course requirements have not been completed yet.'
        );

    expect(Certificate::query()->count())->toBe(0);
});

it('issues only one certificate for the same passed assessment result', function () {
    $user = User::factory()->create();

    ['assessment' => $assessment] = certificateCourse($user);

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

    ['assessment' => $assessment] = certificateCourse($user);

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

it('reuses the certificate when a second assessment in the same course passes', function () {
    $user = User::factory()->create();

    ['assessment' => $assessment, 'enrollment' => $enrollment] = certificateCourse($user);

    $makePassedResult = function (int $attemptNumber) use ($assessment, $user) {
        $attempt = AssessmentAttempt::factory()->create([
            'assessment_id' => $assessment->id,
            'user_id' => $user->id,
            'attempt_number' => $attemptNumber,
            'status' => AssessmentAttemptStatus::PASSED,
            'score' => 90,
            'passed' => true,
        ]);

        return AssessmentResult::factory()->create([
            'assessment_id' => $assessment->id,
            'assessment_attempt_id' => $attempt->id,
            'user_id' => $user->id,
            'score' => 90,
            'passed' => true,
        ]);
    };

    $first = $makePassedResult(1);
    $second = $makePassedResult(2);

    $action = app(
        \App\Domains\Certificates\Actions\IssueCertificateAction::class
    );

    $action->execute($first);
    $action->execute($second);

    $certificate = Certificate::query()->sole();

    expect($certificate->assessment_result_id)->toBe($first->id)
        ->and($certificate->user_id)->toBe($user->id)
        ->and($certificate->course_id)->toBe($enrollment->course_id);
});
