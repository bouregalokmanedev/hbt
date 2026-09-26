<?php

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Enums\AssessmentMode;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\Certificates\Actions\IssueCertificateAction;
use App\Domains\Notifications\Models\StudentNotification;
use App\Domains\Students\Models\StudentNotificationSetting;
use App\Enums\EnrollmentStatus;
use App\Mail\StudentNotificationMail;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

it('notifies the student when a certificate is issued', function () {
    Mail::fake();

    $user = User::factory()->create(['first_name' => 'Leila']);
    StudentNotificationSetting::query()->firstOrCreate(
        ['user_id' => $user->id],
        ['email_enabled' => true, 'in_app_enabled' => true, 'certificate_issued' => true, 'achievement_unlocked' => true, 'course_completion' => true, 'assessment_results' => true, 'security_alerts' => true, 'course_updates' => true, 'lesson_reminders' => true, 'quiz_reminders' => true, 'marketing' => false, 'push_enabled' => true],
    );

    $course = Course::factory()->create(['title' => 'Power Systems']);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => EnrollmentStatus::ACTIVE,
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'assessment_mode' => AssessmentMode::SUMMATIVE,
        'minimum_score' => 50,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::PASSED,
        'score' => 80,
        'passed' => true,
    ]);

    $result = AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $user->id,
        'score' => 80,
        'passed' => true,
        'completed_at' => now(),
    ]);

    $certificate = app(IssueCertificateAction::class)->execute($result);

    $notification = StudentNotification::query()
        ->where('user_id', $user->id)
        ->where('type', 'certificate_issued')
        ->first();

    expect($certificate)->not->toBeNull()
        ->and($notification)->not->toBeNull()
        ->and($notification->title)->toBe('Certificate earned')
        ->and($notification->message)->toContain('Power Systems')
        ->and($notification->action_url)->toBe('/certificates');

    Mail::assertQueued(StudentNotificationMail::class, function (StudentNotificationMail $mail) {
        return $mail->type === 'certificate_issued' && $mail->firstName === 'Leila';
    });
});
