<?php

use App\Domains\AI\Enums\MentorAIRequestType;
use App\Domains\AI\Models\MentorAIUsage;
use App\Domains\AI\Services\MentorUsageService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function usageService(): MentorUsageService
{
    return app(MentorUsageService::class);
}

function usageUser(): User
{
    return User::factory()->create();
}

it('records successful AI usage', function () {
    $user = usageUser();

    $usage = usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        responseTimeMs: 1200,
    );

    expect($usage)
        ->toBeInstanceOf(MentorAIUsage::class)
        ->and($usage->user_id)
        ->toBe($user->id)
        ->and($usage->request_type)
        ->toBe(MentorAIRequestType::MESSAGE)
        ->and($usage->provider)
        ->toBe('openai')
        ->and($usage->model)
        ->toBe('gpt-4o-mini')
        ->and($usage->input_tokens)
        ->toBe(100)
        ->and($usage->output_tokens)
        ->toBe(50)
        ->and($usage->total_tokens)
        ->toBe(150)
        ->and($usage->successful)
        ->toBeTrue();
});

it('records failed AI usage', function () {
    $user = usageUser();

    $usage = usageService()->recordFailure(
        user: $user,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
        responseTimeMs: 900,
        failureReason: 'Provider request failed.',
    );

    expect($usage)
        ->toBeInstanceOf(MentorAIUsage::class)
        ->and($usage->successful)
        ->toBeFalse()
        ->and($usage->failure_reason)
        ->toBe('Provider request failed.')
        ->and($usage->input_tokens)
        ->toBe(0)
        ->and($usage->output_tokens)
        ->toBe(0)
        ->and($usage->total_tokens)
        ->toBe(0);
});

it('records usage for a conversation', function () {
    $user = usageUser();

    $conversation = \App\Domains\AI\Models\MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $usage = usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        conversationId: $conversation->id,
    );

    expect($usage->conversation_id)
        ->toBe($conversation->id);
});

it('calculates total token usage for a user', function () {
    $user = usageUser();

    usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
    );

    usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::STREAM,
        provider: 'openai',
        model: 'gpt-4o-mini',
        inputTokens: 200,
        outputTokens: 100,
        totalTokens: 300,
    );

    expect(
        usageService()->totalTokens($user)
    )->toBe(450);
});

it('calculates total request count for a user', function () {
    $user = usageUser();

    usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
    );

    usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::STREAM,
        provider: 'openai',
        model: 'gpt-4o-mini',
    );

    expect(
        usageService()->requestCount($user)
    )->toBe(2);
});

it('does not include another users usage', function () {
    $user = usageUser();
    $otherUser = usageUser();

    usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
        totalTokens: 200,
    );

    usageService()->record(
        user: $otherUser,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
        totalTokens: 500,
    );

    expect(
        usageService()->totalTokens($user)
    )->toBe(200);

    expect(
        usageService()->requestCount($user)
    )->toBe(1);
});

it('calculates usage for a course', function () {
    $user = usageUser();

    $course = \App\Models\Course::factory()->create();

    usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
        totalTokens: 150,
        courseId: $course->id,
    );

    usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
        totalTokens: 300,
    );

    expect(
        usageService()->totalTokens(
            $user,
            courseId: $course->id,
        )
    )->toBe(150);
});

it('can calculate usage for a date range', function () {
    $user = usageUser();

    $oldUsage = usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
        totalTokens: 100,
    );

    $oldUsage->created_at = now()->subDays(5);
    $oldUsage->save();

    usageService()->record(
        user: $user,
        requestType: MentorAIRequestType::MESSAGE,
        provider: 'openai',
        model: 'gpt-4o-mini',
        totalTokens: 300,
    );

    expect(
        usageService()->totalTokens(
            $user,
            from: now()->subDay(),
        )
    )->toBe(300);
});