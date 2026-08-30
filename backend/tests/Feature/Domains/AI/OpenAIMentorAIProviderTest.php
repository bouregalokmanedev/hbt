<?php

use App\Domains\AI\DTOs\MentorAIResponse;
use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Providers\OpenAIMentorAIProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

function openAIMentorProvider(): OpenAIMentorAIProvider
{
    return app(OpenAIMentorAIProvider::class);
}

function mentorContextForProvider(): MentorContext
{
    return new MentorContext(
        userId: 'user-123',
        courseId: 'course-123',
        lessonId: 'lesson-123',
        course: [
            'id' => 'course-123',
            'title' => 'Engine Management Diagnostics',
        ],
        progress: [
            'percentage' => 68,
        ],
        assessments: [],
        quizzes: [],
        diagnosticScenarios: [],
        memories: [],
    );
}

it('sends the mentor request to the AI provider', function () {
    Http::fake([
        '*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'role' => 'assistant',
                        'content' => 'A lean condition means the engine is receiving too much air or too little fuel.',
                    ],
                ],
            ],
        ], 200),
    ]);

    $conversation = MentorConversation::factory()->create();

    $result = openAIMentorProvider()->respond(
        $conversation,
        mentorContextForProvider(),
        'What is a lean condition?',
    );

    expect($result)
        ->toBeInstanceOf(MentorAIResponse::class);

    expect($result->content)
        ->toBe(
            'A lean condition means the engine is receiving too much air or too little fuel.'
        );

    expect($result->provider)
        ->toBe('openai');

    Http::assertSent(function ($request) {
        return str_contains($request->url(), 'chat/completions')
            && $request['messages'] !== [];
    });
});

it('sends the current mentor context', function () {
    Http::fake([
        '*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'role' => 'assistant',
                        'content' => 'Let us analyze your course context.',
                    ],
                ],
            ],
        ], 200),
    ]);

    $conversation = MentorConversation::factory()->create();

    $result = openAIMentorProvider()->respond(
        $conversation,
        mentorContextForProvider(),
        'Help me with this lesson.',
    );

    expect($result)
        ->toBeInstanceOf(MentorAIResponse::class);

    Http::assertSent(function ($request) {
        $body = json_encode($request->data());

        return str_contains($body, 'Engine Management Diagnostics')
            && str_contains($body, 'course-123')
            && str_contains($body, 'lesson-123')
            && str_contains($body, '68');
    });
});

it('sends previous conversation messages', function () {
    Http::fake([
        '*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'role' => 'assistant',
                        'content' => 'The fuel trim changes because the ECU continuously corrects fueling.',
                    ],
                ],
            ],
        ], 200),
    ]);

    $conversation = MentorConversation::factory()->create();

    MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'user',
        'content' => 'What is fuel trim?',
    ]);

    MentorMessage::factory()->assistant()->create([
        'mentor_conversation_id' => $conversation->id,
        'content' => 'Fuel trim represents ECU corrections to fueling.',
    ]);

    $result = openAIMentorProvider()->respond(
        $conversation,
        mentorContextForProvider(),
        'Why does it change?',
    );

    expect($result)
        ->toBeInstanceOf(MentorAIResponse::class);

    Http::assertSent(function ($request) {
        $messages = $request['messages'];

        return collect($messages)->contains(
            fn ($message) =>
                $message['role'] === 'user'
                && $message['content'] === 'What is fuel trim?'
        )
        && collect($messages)->contains(
            fn ($message) =>
                $message['role'] === 'assistant'
                && $message['content'] === 'Fuel trim represents ECU corrections to fueling.'
        )
        && collect($messages)->contains(
            fn ($message) =>
                $message['role'] === 'user'
                && $message['content'] === 'Why does it change?'
        );
    });
});

it('returns the assistant response', function () {
    Http::fake([
        '*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'role' => 'assistant',
                        'content' => 'Check the fuel trims and oxygen sensor feedback first.',
                    ],
                ],
            ],
        ], 200),
    ]);

    $conversation = MentorConversation::factory()->create();

    $result = openAIMentorProvider()->respond(
        $conversation,
        mentorContextForProvider(),
        'Where should I start diagnosing?',
    );

    expect($result)
        ->toBeInstanceOf(MentorAIResponse::class);

    expect($result->content)
        ->toBe(
            'Check the fuel trims and oxygen sensor feedback first.'
        );

    expect($result->provider)
        ->toBe('openai');
});

it('throws when the AI provider returns an unsuccessful response', function () {
    Http::fake([
        '*' => Http::response([
            'error' => [
                'message' => 'API unavailable',
            ],
        ], 500),
    ]);

    $conversation = MentorConversation::factory()->create();

    expect(fn () => openAIMentorProvider()->respond(
        $conversation,
        mentorContextForProvider(),
        'Help me diagnose this engine.',
    ))->toThrow(RuntimeException::class);
});