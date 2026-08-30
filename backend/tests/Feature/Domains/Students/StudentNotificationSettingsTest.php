<?php

use App\Domains\Students\Models\StudentNotificationSetting;
use App\Models\User;

it('requires authentication to update notification settings', function () {
    $response = $this->patchJson(
        '/api/v1/student/settings/notifications',
        [
            'email_enabled' => false,
        ],
    );

    $response->assertUnauthorized();
});

it('allows a student to disable email notifications', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/notifications',
            [
                'email_enabled' => false,
            ],
        );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.email_enabled',
            false,
        );
});

it('allows a student to update multiple notification settings', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/notifications',
            [
                'email_enabled' => false,
                'push_enabled' => false,
                'lesson_reminders' => false,
                'quiz_reminders' => false,
                'marketing' => true,
            ],
        )
        ->assertOk();

    $settings = StudentNotificationSetting::where(
        'user_id',
        $user->id,
    )->first();

    expect($settings->email_enabled)->toBeFalse();
    expect($settings->push_enabled)->toBeFalse();
    expect($settings->lesson_reminders)->toBeFalse();
    expect($settings->quiz_reminders)->toBeFalse();
    expect($settings->marketing)->toBeTrue();
});

it('does not overwrite notification settings that were not included', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/notifications',
            [
                'email_enabled' => false,
                'marketing' => true,
            ],
        )
        ->assertOk();

    $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/notifications',
            [
                'email_enabled' => true,
            ],
        )
        ->assertOk();

    $settings = StudentNotificationSetting::where(
        'user_id',
        $user->id,
    )->first();

    expect($settings->email_enabled)->toBeTrue();
    expect($settings->marketing)->toBeTrue();
});

it('rejects non boolean notification values', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson(
            '/api/v1/student/settings/notifications',
            [
                'email_enabled' => 'yes',
            ],
        );

    $response
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'email_enabled',
        ]);
});