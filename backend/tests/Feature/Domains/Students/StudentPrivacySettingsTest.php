<?php

use App\Domains\Students\Models\StudentPrivacySetting;
use App\Models\User;

it('requires authentication to update privacy settings', function () {
    $response = $this->patchJson(
        '/api/v1/student/settings/privacy',
        [
            'profile_visibility' => 'public',
        ],
    );

    $response->assertUnauthorized();
});

it('allows a student to change profile visibility', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/privacy', [
            'profile_visibility' => 'public',
        ]);

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.profile_visibility',
            'public',
        );
});

it('allows a student to update privacy toggles', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/privacy', [
            'show_learning_activity' => true,
            'show_achievements' => false,
            'show_certificates' => false,
            'show_course_progress' => true,
            'allow_personalized_recommendations' => false,
            'allow_analytics' => false,
        ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.show_learning_activity', true)
        ->assertJsonPath('data.show_achievements', false)
        ->assertJsonPath('data.show_certificates', false)
        ->assertJsonPath('data.show_course_progress', true)
        ->assertJsonPath(
            'data.allow_personalized_recommendations',
            false,
        )
        ->assertJsonPath(
            'data.allow_analytics',
            false,
        );
});

it('does not overwrite privacy settings that were not included', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/privacy', [
            'profile_visibility' => 'public',
            'show_learning_activity' => true,
            'show_achievements' => false,
        ])
        ->assertOk();

    $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/privacy', [
            'profile_visibility' => 'connections',
        ])
        ->assertOk();

    $this
        ->actingAs($user)
        ->getJson('/api/v1/student/settings')
        ->assertOk()
        ->assertJsonPath(
            'data.privacy.profile_visibility',
            'connections',
        )
        ->assertJsonPath(
            'data.privacy.show_learning_activity',
            true,
        )
        ->assertJsonPath(
            'data.privacy.show_achievements',
            false,
        );
});

it('rejects an unsupported profile visibility', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/privacy', [
            'profile_visibility' => 'invalid',
        ]);

    $response->assertUnprocessable();

    $response->assertJsonValidationErrors([
        'profile_visibility',
    ]);
});

it('rejects non boolean privacy values', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/privacy', [
            'show_learning_activity' => 'yes',
            'show_achievements' => 'true',
            'allow_analytics' => 'enabled',
        ]);

    $response->assertUnprocessable();

    $response->assertJsonValidationErrors([
        'show_learning_activity',
        'show_achievements',
        'allow_analytics',
    ]);
});

it('persists privacy settings', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/privacy', [
            'profile_visibility' => 'public',
            'show_course_progress' => true,
            'allow_analytics' => false,
        ])
        ->assertOk();

    $settings = StudentPrivacySetting::where(
        'user_id',
        $user->id,
    )->first();

    expect($settings)->not->toBeNull()
        ->and($settings->profile_visibility)->toBe('public')
        ->and($settings->show_course_progress)->toBeTrue()
        ->and($settings->allow_analytics)->toBeFalse();
});