<?php

use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Enums\MentorFeedbackReason;
use App\Domains\AI\Models\MentorAIUsage;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Models\MentorMessageFeedback;
use App\Domains\AI\Services\MentorConversationAnalyticsService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function analyticsUser(): User
{
    return User::factory()->create();
}

function analyticsConversation(User $user): MentorConversation
{
    return MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);
}

function analyticsMessage(
    MentorConversation $conversation,
    string $role,
    string $content = 'Test mentor message.',
): MentorMessage {
    return MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => $role,
        'content' => $content,
    ]);
}

function analyticsFeedback(
    MentorMessage $message,
    User $user,
    MentorFeedbackRating $rating,
    ?MentorFeedbackReason $reason = null,
): MentorMessageFeedback {
    return MentorMessageFeedback::factory()->create([
        'mentor_message_id' => $message->id,
        'user_id' => $user->id,
        'rating' => $rating,
        'reason' => $reason,
    ]);
}

function analyticsService(): MentorConversationAnalyticsService
{
    return app(MentorConversationAnalyticsService::class);
}

/*
|--------------------------------------------------------------------------
| Total messages
|--------------------------------------------------------------------------
*/

it('calculates total messages', function () {
    $user = analyticsUser();

    $conversation = analyticsConversation($user);

    analyticsMessage($conversation, 'user', 'Explain fuel trim.');

    analyticsMessage(
        $conversation,
        'assistant',
        'Fuel trim represents ECU fuel correction.',
    );

    analyticsMessage(
        $conversation,
        'user',
        'What does positive fuel trim mean?',
    );

    $analytics = analyticsService()->calculate($conversation);

    expect($analytics['total_messages'])
        ->toBe(3);
});

/*
|--------------------------------------------------------------------------
| User and assistant messages
|--------------------------------------------------------------------------
*/

it('calculates user and assistant messages', function () {
    $user = analyticsUser();

    $conversation = analyticsConversation($user);

    analyticsMessage($conversation, 'user');
    analyticsMessage($conversation, 'user');

    analyticsMessage($conversation, 'assistant');
    analyticsMessage($conversation, 'assistant');
    analyticsMessage($conversation, 'assistant');

    $analytics = analyticsService()->calculate($conversation);

    expect($analytics['user_messages'])
        ->toBe(2);

    expect($analytics['assistant_messages'])
        ->toBe(3);
});

/*
|--------------------------------------------------------------------------
| Feedback statistics
|--------------------------------------------------------------------------
*/

it('calculates feedback statistics', function () {
    $user = analyticsUser();

    $conversation = analyticsConversation($user);

    $assistantOne = analyticsMessage(
        $conversation,
        'assistant',
    );

    $assistantTwo = analyticsMessage(
        $conversation,
        'assistant',
    );

    $assistantThree = analyticsMessage(
        $conversation,
        'assistant',
    );

    analyticsFeedback(
        $assistantOne,
        $user,
        MentorFeedbackRating::POSITIVE,
        MentorFeedbackReason::HELPFUL,
    );

    analyticsFeedback(
        $assistantTwo,
        $user,
        MentorFeedbackRating::POSITIVE,
        MentorFeedbackReason::HELPFUL,
    );

    analyticsFeedback(
        $assistantThree,
        $user,
        MentorFeedbackRating::NEGATIVE,
        MentorFeedbackReason::INCORRECT,
    );

    $analytics = analyticsService()->calculate($conversation);

    expect($analytics['total_feedback'])
        ->toBe(3);

    expect($analytics['positive_feedback'])
        ->toBe(2);

    expect($analytics['negative_feedback'])
        ->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Feedback rate
|--------------------------------------------------------------------------
*/

it('calculates feedback rate', function () {
    $user = analyticsUser();

    $conversation = analyticsConversation($user);

    $assistantOne = analyticsMessage(
        $conversation,
        'assistant',
    );

    $assistantTwo = analyticsMessage(
        $conversation,
        'assistant',
    );

    $assistantThree = analyticsMessage(
        $conversation,
        'assistant',
    );

    $assistantFour = analyticsMessage(
        $conversation,
        'assistant',
    );

    analyticsFeedback(
        $assistantOne,
        $user,
        MentorFeedbackRating::POSITIVE,
    );

    analyticsFeedback(
        $assistantTwo,
        $user,
        MentorFeedbackRating::POSITIVE,
    );

    $analytics = analyticsService()->calculate($conversation);

    expect($analytics['feedback_rate'])
        ->toBe(50.0);
});

/*
|--------------------------------------------------------------------------
| AI usage statistics
|--------------------------------------------------------------------------
*/

it('calculates AI usage statistics', function () {
    $user = analyticsUser();

    $conversation = analyticsConversation($user);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'total_tokens' => 100,
        'successful' => true,
    ]);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'total_tokens' => 200,
        'successful' => true,
    ]);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'total_tokens' => 50,
        'successful' => false,
    ]);

    $analytics = analyticsService()->calculate($conversation);

    expect($analytics['total_ai_requests'])
        ->toBe(3);

    expect($analytics['successful_ai_requests'])
        ->toBe(2);

    expect($analytics['failed_ai_requests'])
        ->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Token usage
|--------------------------------------------------------------------------
*/

it('calculates token usage', function () {
    $user = analyticsUser();

    $conversation = analyticsConversation($user);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'input_tokens' => 100,
        'output_tokens' => 50,
        'total_tokens' => 150,
    ]);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'input_tokens' => 200,
        'output_tokens' => 100,
        'total_tokens' => 300,
    ]);

    $analytics = analyticsService()->calculate($conversation);

    expect($analytics['total_input_tokens'])
        ->toBe(300);

    expect($analytics['total_output_tokens'])
        ->toBe(150);

    expect($analytics['total_tokens'])
        ->toBe(450);
});

/*
|--------------------------------------------------------------------------
| Average response time
|--------------------------------------------------------------------------
*/

it('calculates average response time', function () {
    $user = analyticsUser();

    $conversation = analyticsConversation($user);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'response_time_ms' => 100,
    ]);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'response_time_ms' => 200,
    ]);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'response_time_ms' => 300,
    ]);

    $analytics = analyticsService()->calculate($conversation);

    expect($analytics['average_response_time'])
        ->toBe(200.0);
});

/*
|--------------------------------------------------------------------------
| Empty conversation
|--------------------------------------------------------------------------
*/

it('handles a conversation with no messages', function () {
    $user = analyticsUser();

    $conversation = analyticsConversation($user);

    $analytics = analyticsService()->calculate($conversation);

    expect($analytics['total_messages'])
        ->toBe(0);

    expect($analytics['user_messages'])
        ->toBe(0);

    expect($analytics['assistant_messages'])
        ->toBe(0);

    expect($analytics['total_feedback'])
        ->toBe(0);

    expect($analytics['feedback_rate'])
        ->toBe(0.0);
});

/*
|--------------------------------------------------------------------------
| No feedback
|--------------------------------------------------------------------------
*/

it('handles a conversation with no feedback', function () {
    $user = analyticsUser();

    $conversation = analyticsConversation($user);

    analyticsMessage(
        $conversation,
        'assistant',
    );

    analyticsMessage(
        $conversation,
        'assistant',
    );

    $analytics = analyticsService()->calculate($conversation);

    expect($analytics['total_feedback'])
        ->toBe(0);

    expect($analytics['positive_feedback'])
        ->toBe(0);

    expect($analytics['negative_feedback'])
        ->toBe(0);

    expect($analytics['feedback_rate'])
        ->toBe(0.0);
});