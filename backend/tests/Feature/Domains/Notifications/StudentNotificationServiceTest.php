<?php

use App\Domains\Notifications\Models\StudentNotification;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Students\Models\StudentNotificationSetting;
use App\Mail\StudentNotificationMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

function notifyPrefs(User $user, array $overrides = []): StudentNotificationSetting
{
    return StudentNotificationSetting::query()->firstOrCreate(
        ['user_id' => $user->id],
        array_merge([
            'email_enabled' => true,
            'push_enabled' => true,
            'in_app_enabled' => true,
            'course_updates' => true,
            'lesson_reminders' => true,
            'quiz_reminders' => true,
            'assessment_results' => true,
            'certificate_issued' => true,
            'achievement_unlocked' => true,
            'course_completion' => true,
            'security_alerts' => true,
            'marketing' => false,
        ], $overrides),
    );
}

it('creates an in-app notification and queues a personalized email by default', function () {
    Mail::fake();

    $user = User::factory()->create(['first_name' => 'Amina']);
    notifyPrefs($user);

    $delivered = app(StudentNotificationService::class)->send(
        $user,
        'lesson_completed',
        'Lesson completed',
        'You finished "Ohm\'s Law".',
        '/my-courses',
        'lesson-completed:test-1',
    );

    expect($delivered)->toBeTrue();

    $notification = StudentNotification::query()
        ->where('user_id', $user->id)
        ->where('dedupe_key', 'lesson-completed:test-1')
        ->first();

    expect($notification)->not->toBeNull()
        ->and($notification->type)->toBe('lesson_completed')
        ->and($notification->read_at)->toBeNull();

    Mail::assertQueued(StudentNotificationMail::class, function (StudentNotificationMail $mail) {
        return $mail->firstName === 'Amina'
            && $mail->type === 'lesson_completed'
            && $mail->notifyTitle === 'Lesson completed';
    });
});

it('still queues email when in-app notifications are disabled', function () {
    Mail::fake();

    $user = User::factory()->create(['first_name' => 'Sara']);
    notifyPrefs($user, ['in_app_enabled' => false]);

    $delivered = app(StudentNotificationService::class)->send(
        $user,
        'course_completed',
        'Course completed',
        'You completed "Electronics 101".',
        '/my-courses',
        'course-completed:test-1',
    );

    expect($delivered)->toBeTrue();

    $notification = StudentNotification::query()
        ->where('user_id', $user->id)
        ->where('dedupe_key', 'course-completed:test-1')
        ->first();

    // Ledger row exists (dedupe) but is pre-read so badges stay quiet.
    expect($notification)->not->toBeNull()
        ->and($notification->read_at)->not->toBeNull();

    Mail::assertQueued(StudentNotificationMail::class);
});

it('does not send anything when both in-app and email are disabled', function () {
    Mail::fake();

    $user = User::factory()->create();
    notifyPrefs($user, [
        'in_app_enabled' => false,
        'email_enabled' => false,
    ]);

    $delivered = app(StudentNotificationService::class)->send(
        $user,
        'security',
        'Password changed',
        'Your password was changed.',
        '/settings',
        'pwd:test',
    );

    expect($delivered)->toBeFalse()
        ->and(StudentNotification::query()->where('user_id', $user->id)->count())->toBe(0);

    Mail::assertNothingQueued();
});

it('respects the per-type preference for course completion emails', function () {
    Mail::fake();

    $user = User::factory()->create();
    notifyPrefs($user, ['course_completion' => false]);

    $delivered = app(StudentNotificationService::class)->send(
        $user,
        'course_completed',
        'Course completed',
        'Done.',
        '/my-courses',
        'course-completed:opt-out',
    );

    // In-app still created; email suppressed by course_completion toggle.
    expect($delivered)->toBeTrue()
        ->and(StudentNotification::query()->where('dedupe_key', 'course-completed:opt-out')->exists())->toBeTrue();

    Mail::assertNothingQueued();
});

it('maps assessment result types to the assessment_results preference', function () {
    Mail::fake();

    $user = User::factory()->create();
    notifyPrefs($user, ['assessment_results' => false]);

    app(StudentNotificationService::class)->send(
        $user,
        'assessment_passed',
        'Assessment passed',
        'Nice.',
        '/certificates',
        'assessment-result:opt-out',
    );

    Mail::assertNothingQueued();
});

it('maps learning_streak to achievement_unlocked preference', function () {
    Mail::fake();

    $user = User::factory()->create();
    notifyPrefs($user, ['achievement_unlocked' => false]);

    app(StudentNotificationService::class)->send(
        $user,
        'learning_streak',
        '7-day learning streak',
        'Keep going.',
        '/achievements',
        'streak:opt-out',
    );

    Mail::assertNothingQueued();
});

it('does not re-send for the same dedupe key', function () {
    Mail::fake();

    $user = User::factory()->create();
    notifyPrefs($user);

    $service = app(StudentNotificationService::class);

    expect($service->send($user, 'lesson', 'Title', 'Message', null, 'dupe-key'))->toBeTrue();
    expect($service->send($user, 'lesson', 'Title', 'Message', null, 'dupe-key'))->toBeFalse();

    Mail::assertQueuedCount(1);
});

it('hides the in-app feed while in_app_enabled is false', function () {
    $user = User::factory()->create();
    notifyPrefs($user, ['in_app_enabled' => false]);

    StudentNotification::query()->create([
        'user_id' => $user->id,
        'type' => 'lesson_completed',
        'title' => 'Hidden',
        'message' => 'Should not appear in feed.',
        'action_url' => '/my-courses',
        'dedupe_key' => 'hidden-1',
    ]);

    $this->actingAs($user)
        ->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonPath('data.items', [])
        ->assertJsonPath('data.unread_count', 0);

    $this->actingAs($user)
        ->getJson('/api/v1/notifications/sidebar-badges')
        ->assertOk();
});

it('shows the in-app feed when in_app_enabled is true', function () {
    $user = User::factory()->create();
    notifyPrefs($user, ['in_app_enabled' => true]);

    StudentNotification::query()->create([
        'user_id' => $user->id,
        'type' => 'lesson_completed',
        'title' => 'Visible',
        'message' => 'Appears in feed.',
        'action_url' => '/my-courses',
        'dedupe_key' => 'visible-1',
    ]);

    $this->actingAs($user)
        ->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonPath('data.unread_count', 1)
        ->assertJsonPath('data.items.0.title', 'Visible');
});
