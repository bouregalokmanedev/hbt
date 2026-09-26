<?php

use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Quizzes\Models\QuizAttemptAnswer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns the latest failed quiz with its missed question count', function () {
    $user = User::factory()->create();

    $attempt = QuizAttempt::factory()->submitted()->create([
        'user_id' => $user->id,
        'passed' => false,
        'percentage' => 40,
    ]);

    QuizAttemptAnswer::factory()->count(2)->create(['attempt_id' => $attempt->id]);
    QuizAttemptAnswer::factory()->correct()->create(['attempt_id' => $attempt->id]);

    $quiz = $attempt->quiz;

    $response = $this->actingAs($user)
        ->getJson('/api/v1/auth/dashboard')
        ->assertOk();

    $item = collect($response->json('data.review_due'))->firstWhere('id', $quiz->id);

    expect($item)->not->toBeNull();
    expect($item['wrong_count'])->toBe(2);
    expect($item['title'])->toBe($quiz->title);
    expect($item['action_url'])->toContain($quiz->id);
});

it('keeps the review queue empty for a student who passed', function () {
    $user = User::factory()->create();

    QuizAttempt::factory()->submitted()->create([
        'user_id' => $user->id,
        'passed' => true,
        'percentage' => 100,
    ]);

    $this->actingAs($user)
        ->getJson('/api/v1/auth/dashboard')
        ->assertOk()
        ->assertJsonPath('data.review_due', []);
});

it('ignores unfinished attempts in the review queue', function () {
    $user = User::factory()->create();

    QuizAttempt::factory()->create([
        'user_id' => $user->id,
        'status' => 'in_progress',
        'passed' => false,
        'submitted_at' => null,
    ]);

    $this->actingAs($user)
        ->getJson('/api/v1/auth/dashboard')
        ->assertOk()
        ->assertJsonPath('data.review_due', []);
});
