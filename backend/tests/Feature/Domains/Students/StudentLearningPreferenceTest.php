<?php

use App\Domains\Students\Models\StudentLearningPreference;
use App\Models\User;

it('requires authentication to update learning preferences', function () {
    $response = $this->patchJson(
        '/api/v1/student/settings/learning',
        [
            'preferred_content_language' => 'fr',
        ],
    );

    $response->assertUnauthorized();
});

it('allows a student to change preferred content language', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'preferred_content_language' => 'fr',
        ]);

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.preferred_content_language',
            'fr',
        );
});

it('allows a student to change difficulty preference', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'difficulty_preference' => 'beginner',
        ]);

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.difficulty_preference',
            'beginner',
        );
});

it('allows a student to update learning toggles', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'autoplay_lessons' => false,
            'resume_last_position' => false,
            'show_completed_lessons' => false,
            'show_quiz_explanations' => false,
            'confirm_before_quiz_submit' => false,
        ]);

    $response
        ->assertOk()
        ->assertJsonPath('data.autoplay_lessons', false)
        ->assertJsonPath('data.resume_last_position', false)
        ->assertJsonPath('data.show_completed_lessons', false)
        ->assertJsonPath('data.show_quiz_explanations', false)
        ->assertJsonPath('data.confirm_before_quiz_submit', false);
});

it('allows a student to update daily and weekly learning goals', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'daily_learning_goal_minutes' => 60,
            'weekly_learning_goal_minutes' => 300,
        ]);

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.daily_learning_goal_minutes',
            60,
        )
        ->assertJsonPath(
            'data.weekly_learning_goal_minutes',
            300,
        );
});

it('does not overwrite learning preferences that were not included', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'preferred_content_language' => 'fr',
            'difficulty_preference' => 'beginner',
            'autoplay_lessons' => false,
        ])
        ->assertOk();

    $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'autoplay_lessons' => true,
        ])
        ->assertOk();

    $this
        ->actingAs($user)
        ->getJson('/api/v1/student/settings')
        ->assertOk()
        ->assertJsonPath(
            'data.learning.preferred_content_language',
            'fr',
        )
        ->assertJsonPath(
            'data.learning.difficulty_preference',
            'beginner',
        )
        ->assertJsonPath(
            'data.learning.autoplay_lessons',
            true,
        );
});

it('rejects an unsupported content language', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'preferred_content_language' => 'invalid',
        ]);

    $response->assertUnprocessable();

    $response->assertJsonValidationErrors([
        'preferred_content_language',
    ]);
});

it('rejects an unsupported difficulty preference', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'difficulty_preference' => 'invalid',
        ]);

    $response->assertUnprocessable();

    $response->assertJsonValidationErrors([
        'difficulty_preference',
    ]);
});

it('rejects non boolean learning preferences', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'autoplay_lessons' => 'yes',
            'resume_last_position' => 'enabled',
        ]);

    $response->assertUnprocessable();

    $response->assertJsonValidationErrors([
        'autoplay_lessons',
        'resume_last_position',
    ]);
});

it('rejects invalid learning goal values', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'daily_learning_goal_minutes' => 0,
            'weekly_learning_goal_minutes' => -10,
        ]);

    $response->assertUnprocessable();

    $response->assertJsonValidationErrors([
        'daily_learning_goal_minutes',
        'weekly_learning_goal_minutes',
    ]);
});

it('persists learning preferences', function () {
    $user = User::factory()->create();

    $this
        ->actingAs($user)
        ->patchJson('/api/v1/student/settings/learning', [
            'preferred_content_language' => 'ar',
            'difficulty_preference' => 'advanced',
            'autoplay_lessons' => false,
            'resume_last_position' => true,
            'daily_learning_goal_minutes' => 45,
            'weekly_learning_goal_minutes' => 240,
        ])
        ->assertOk();

    $settings = StudentLearningPreference::where(
        'user_id',
        $user->id,
    )->first();

    expect($settings)->not->toBeNull();

    expect($settings->preferred_content_language)
        ->toBe('ar');

    expect($settings->difficulty_preference)
        ->toBe('advanced');

    expect($settings->autoplay_lessons)
        ->toBeFalse();

    expect($settings->resume_last_position)
        ->toBeTrue();

    expect($settings->daily_learning_goal_minutes)
        ->toBe(45);

    expect($settings->weekly_learning_goal_minutes)
        ->toBe(240);
});