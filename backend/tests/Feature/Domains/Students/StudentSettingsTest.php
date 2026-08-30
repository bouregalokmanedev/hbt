<?php

use App\Models\User;
use App\Domains\Students\Models\StudentLearningPreference;
use App\Domains\Students\Models\StudentNotificationSetting;
use App\Domains\Students\Models\StudentPrivacySetting;
use App\Domains\Students\Models\StudentSetting;
use App\Domains\Students\Enums\Apperance;


it('returns default settings for the authenticated student', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->getJson('/api/v1/student/settings');

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.account.language',
            'en',
        )
        ->assertJsonPath(
            'data.account.timezone',
            'Africa/Algiers',
        )
        ->assertJsonPath(
            'data.appearance.appearance',
            'system',
        )
        ->assertJsonPath(
            'data.appearance.compact_mode',
            false,
        )
        ->assertJsonPath(
            'data.notifications.email_enabled',
            true,
        )
        ->assertJsonPath(
            'data.notifications.marketing',
            false,
        )
        ->assertJsonPath(
            'data.privacy.profile_visibility',
            'private',
        )
        ->assertJsonPath(
            'data.learning.daily_learning_goal_minutes',
            30,
        );
});
it('requires authentication to access student settings', function () {
    $response = $this->getJson(
        '/api/v1/student/settings',
    );

    $response->assertUnauthorized();
});
it('creates all default settings for the student', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->getJson('/api/v1/student/settings')
        ->assertOk();

    expect(
        StudentSetting::where(
            'user_id',
            $user->id,
        )->exists()
    )->toBeTrue();

    expect(
        StudentNotificationSetting::where(
            'user_id',
            $user->id,
        )->exists()
    )->toBeTrue();

    expect(
        StudentPrivacySetting::where(
            'user_id',
            $user->id,
        )->exists()
    )->toBeTrue();

    expect(
        StudentLearningPreference::where(
            'user_id',
            $user->id,
        )->exists()
    )->toBeTrue();
});
it('does not duplicate settings when requested multiple times', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->getJson('/api/v1/student/settings')
        ->assertOk();

    $this
        ->actingAs($user)
        ->getJson('/api/v1/student/settings')
        ->assertOk();

    expect(
        StudentSetting::where(
            'user_id',
            $user->id,
        )->count()
    )->toBe(1);

    expect(
        StudentNotificationSetting::where(
            'user_id',
            $user->id,
        )->count()
    )->toBe(1);

    expect(
        StudentPrivacySetting::where(
            'user_id',
            $user->id,
        )->count()
    )->toBe(1);

    expect(
        StudentLearningPreference::where(
            'user_id',
            $user->id,
        )->count()
    )->toBe(1);
});
it('allows a student to update their language', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings', [
            'language' => 'ar',
        ]);

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.account.language',
            'ar',
        );
});
it('allows a student to update appearance settings', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings', [
            'appearance' => 'dark',
            'compact_mode' => true,
            'reduced_motion' => true,
        ]);

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.appearance.appearance',
            'dark',
        )
        ->assertJsonPath(
            'data.appearance.compact_mode',
            true,
        )
        ->assertJsonPath(
            'data.appearance.reduced_motion',
            true,
        );
});
it('rejects an unsupported language', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings', [
            'language' => 'de',
        ]);

    $response->assertUnprocessable();

    $response->assertJsonValidationErrors([
        'language',
    ]);
});
it('rejects an unsupported appearance', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings', [
            'appearance' => 'blue',
        ]);

    $response->assertUnprocessable();

    $response->assertJsonValidationErrors([
        'appearance',
    ]);
});
it('persists updated settings', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings', [
            'language' => 'fr',
            'appearance' => 'light',
            'compact_mode' => true,
        ])
        ->assertOk();

    $this
        ->actingAs($user)
        ->getJson('/api/v1/student/settings')
        ->assertOk()
        ->assertJsonPath(
            'data.account.language',
            'fr',
        )
        ->assertJsonPath(
            'data.appearance.appearance',
            'light',
        )
        ->assertJsonPath(
            'data.appearance.compact_mode',
            true,
        );
});
it('does not overwrite settings that were not included in the update', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings', [
            'language' => 'ar',
            'appearance' => 'dark',
            'compact_mode' => true,
        ])
        ->assertOk();

    $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings', [
            'language' => 'fr',
        ])
        ->assertOk();

    $this
        ->actingAs($user)
        ->getJson('/api/v1/student/settings')
        ->assertOk()
        ->assertJsonPath(
            'data.account.language',
            'fr',
        )
        ->assertJsonPath(
            'data.appearance.appearance',
            'dark',
        )
        ->assertJsonPath(
            'data.appearance.compact_mode',
            true,
        );
});