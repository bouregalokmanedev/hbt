<?php

use App\Domains\AI\DTOs\MentorContextBudget;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Services\MentorConversationContextService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function mentorConversationContextService(): MentorConversationContextService
{
    return app(MentorConversationContextService::class);
}

it('returns recent conversation messages', function () {
    $conversation = MentorConversation::factory()->create();

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'What is fuel trim?',
    ]);

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'assistant',
        'content' => 'Fuel trim represents ECU corrections to fueling.',
    ]);

    $result = mentorConversationContextService()->recentMessages(
        $conversation,
        1000,
    );

    expect($result)
        ->toHaveCount(2)
        ->and($result[0]['role'])
        ->toBe('user')
        ->and($result[1]['role'])
        ->toBe('assistant');
});

it('preserves chronological order', function () {
    $conversation = MentorConversation::factory()->create();

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'First question.',
    ]);

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'assistant',
        'content' => 'First answer.',
    ]);

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'Second question.',
    ]);

    $result = mentorConversationContextService()->recentMessages(
        $conversation,
        1000,
    );

    expect($result)->toHaveCount(3);

    expect($result[0]['content'])
        ->toBe('First question.');

    expect($result[1]['content'])
        ->toBe('First answer.');

    expect($result[2]['content'])
        ->toBe('Second question.');
});

it('keeps the newest messages when the budget is exceeded', function () {
    $conversation = MentorConversation::factory()->create();

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => str_repeat('old message ', 100),
    ]);

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'assistant',
        'content' => str_repeat('middle message ', 100),
    ]);

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'Most recent message.',
    ]);

    $result = mentorConversationContextService()->recentMessages(
        $conversation,
        20,
    );

    expect($result)->not->toBeEmpty();

    expect(collect($result)->pluck('content'))
        ->toContain('Most recent message.');

    expect(collect($result)->pluck('content'))
        ->not->toContain(str_repeat('old message ', 100));
});

it('does not exceed the requested conversation budget', function () {
    $conversation = MentorConversation::factory()->create();

    foreach (range(1, 10) as $index) {
        MentorMessage::factory()->create([
            'mentor_conversation_id' => $conversation->id,
            'role' => $index % 2 === 0
                ? 'assistant'
                : 'user',
            'content' => str_repeat("Message {$index} ", 50),
        ]);
    }

    $budget = 100;

    $service = mentorConversationContextService();

    $result = $service->recentMessages(
        $conversation,
        $budget,
    );

    $estimatedTokens = app(
        \App\Domains\AI\Services\MentorTokenEstimator::class
    )->estimateMessages($result);

    expect($estimatedTokens)
        ->toBeLessThanOrEqual($budget);
});

it('handles an empty conversation', function () {
    $conversation = MentorConversation::factory()->create();

    $result = mentorConversationContextService()->recentMessages(
        $conversation,
        1000,
    );

    expect($result)
        ->toBe([]);
});

it('builds conversation context using the configured budget', function () {
    $conversation = MentorConversation::factory()->create();

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'Explain fuel trims.',
    ]);

    $budget = new MentorContextBudget(
        maximumTokens: 6000,
        systemTokens: 1200,
        memoryTokens: 1000,
        conversationTokens: 3000,
        responseTokens: 1800,
    );

    $result = mentorConversationContextService()->build(
        $conversation,
        $budget,
    );

    expect($result)
        ->toHaveCount(1)
        ->and($result[0]['role'])
        ->toBe('user')
        ->and($result[0]['content'])
        ->toBe('Explain fuel trims.');
});