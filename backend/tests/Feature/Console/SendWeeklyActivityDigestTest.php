<?php

use App\Console\Commands\SendWeeklyActivityDigest;
use App\Domains\Notifications\Models\StudentNotification;
use App\Domains\Progression\Models\StudentXpTransaction;
use App\Enums\UserRole;
use App\Mail\StudentNotificationMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

function weeklyStudent(array $attributes = []): User
{
    \Spatie\Permission\Models\Role::findOrCreate('Student', 'web');

    $user = User::factory()->create($attributes);
    $user->syncRoles([UserRole::STUDENT->value]);

    return $user;
}

it('sends a weekly activity recap to active students', function () {
    Mail::fake();

    $active = weeklyStudent(['first_name' => 'Nadia', 'status' => 'active']);
    $inactiveRole = User::factory()->create(['status' => 'active']); // no student role

    StudentXpTransaction::create([
        'user_id' => $active->id,
        'event' => 'lesson_completed',
        'xp' => 12,
        'dedupe_key' => 'lesson:weekly-1',
        'metadata' => [],
    ]);

    StudentXpTransaction::create([
        'user_id' => $inactiveRole->id,
        'event' => 'lesson_completed',
        'xp' => 12,
        'dedupe_key' => 'lesson:weekly-other',
        'metadata' => [],
    ]);

    $this->artisan(SendWeeklyActivityDigest::class)->assertSuccessful();

    $notification = StudentNotification::query()
        ->where('user_id', $active->id)
        ->where('type', 'weekly_activity')
        ->first();

    expect($notification)->not->toBeNull()
        ->and($notification->title)->toBe('Your weekly learning recap')
        ->and($notification->message)->toContain('Hi Nadia')
        ->and($notification->message)->toContain('XP');

    Mail::assertQueued(StudentNotificationMail::class, function (StudentNotificationMail $mail) {
        return $mail->type === 'weekly_activity' && $mail->firstName === 'Nadia';
    });

    expect(StudentNotification::query()->where('user_id', $inactiveRole->id)->count())->toBe(0);
});

it('does not double-send the same weekly digest week', function () {
    Mail::fake();

    $student = weeklyStudent(['first_name' => 'Omar', 'status' => 'active']);

    StudentXpTransaction::create([
        'user_id' => $student->id,
        'event' => 'assessment_passed',
        'xp' => 50,
        'dedupe_key' => 'assessment:weekly-1',
        'metadata' => [],
    ]);

    $this->artisan(SendWeeklyActivityDigest::class)->assertSuccessful();
    $this->artisan(SendWeeklyActivityDigest::class)->assertSuccessful();

    expect(StudentNotification::query()
        ->where('user_id', $student->id)
        ->where('type', 'weekly_activity')
        ->count())->toBe(1);

    Mail::assertQueuedCount(1);
});

it('skips quietly when nobody was active', function () {
    Mail::fake();

    weeklyStudent(['first_name' => 'Idle', 'status' => 'active']);

    $this->artisan(SendWeeklyActivityDigest::class)->assertSuccessful();

    Mail::assertNothingQueued();
    expect(StudentNotification::query()->where('type', 'weekly_activity')->count())->toBe(0);
});
