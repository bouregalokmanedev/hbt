<?php

use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Enums\MentorFeedbackReason;
use App\Domains\AI\Enums\MentorMessageRole;
use App\Domains\AI\Models\MentorAIUsage;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Models\MentorMessageFeedback;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function analyticsControllerUser(): User
{
    return User::factory()->create();
}

function analyticsControllerConversation(
    User $user,
): MentorConversation {
    return MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);
}

function analyticsControllerMessage(
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

function analyticsControllerUrl(
    MentorConversation $conversation,
): string {
    return "/api/v1/mentor/conversations/{$conversation->id}/analytics";
}

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

it('requires authentication to view conversation analytics', function () {
    $user = analyticsControllerUser();

    $conversation = analyticsControllerConversation($user);

    $response = $this->getJson(
        analyticsControllerUrl($conversation)
    );

    $response->assertUnauthorized();
});

/*
|--------------------------------------------------------------------------
| Analytics response
|--------------------------------------------------------------------------
*/

it('returns conversation analytics', function () {
    $user = analyticsControllerUser();

    $conversation = analyticsControllerConversation($user);

    $this->actingAs($user);

    $response = $this->getJson(
        analyticsControllerUrl($conversation)
    );

    $response
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'total_messages',
                'user_messages',
                'assistant_messages',
                'total_feedback',
                'positive_feedback',
                'negative_feedback',
                'feedback_rate',
                'successful_ai_requests',
                'failed_ai_requests',
                'total_input_tokens',
                'total_output_tokens',
                'total_tokens',
                'average_response_time',
            ],
        ]);
});

/*
|--------------------------------------------------------------------------
| Message statistics
|--------------------------------------------------------------------------
*/

it('returns message statistics', function () {
    $user = analyticsControllerUser();

    $conversation = analyticsControllerConversation($user);

    analyticsControllerMessage(
        $conversation,
        MentorMessageRole::USER->value,
        'What is fuel trim?',
    );

    analyticsControllerMessage(
        $conversation,
        MentorMessageRole::ASSISTANT->value,
        'Fuel trim represents ECU fuel correction.',
    );

    analyticsControllerMessage(
        $conversation,
        MentorMessageRole::USER->value,
        'What does positive fuel trim mean?',
    );

    $this->actingAs($user);

    $response = $this->getJson(
        analyticsControllerUrl($conversation)
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.total_messages',
            3
        )
        ->assertJsonPath(
            'data.user_messages',
            2
        )
        ->assertJsonPath(
            'data.assistant_messages',
            1
        );
});

/*
|--------------------------------------------------------------------------
| Feedback statistics
|--------------------------------------------------------------------------
*/

it('returns feedback statistics', function () {
    $user = analyticsControllerUser();

    $conversation = analyticsControllerConversation($user);

    $assistantOne = analyticsControllerMessage(
        $conversation,
        MentorMessageRole::ASSISTANT->value,
        'Positive fuel trim means the ECU is adding fuel.',
    );

    $assistantTwo = analyticsControllerMessage(
        $conversation,
        MentorMessageRole::ASSISTANT->value,
        'Negative fuel trim means the ECU is removing fuel.',
    );

    $assistantThree = analyticsControllerMessage(
        $conversation,
        MentorMessageRole::ASSISTANT->value,
        'Fuel trim should be evaluated with other diagnostic data.',
    );

    MentorMessageFeedback::factory()->create([
        'mentor_message_id' => $assistantOne->id,
        'user_id' => $user->id,
        'rating' => MentorFeedbackRating::POSITIVE,
    ]);

    MentorMessageFeedback::factory()->create([
        'mentor_message_id' => $assistantTwo->id,
        'user_id' => $user->id,
        'rating' => MentorFeedbackRating::POSITIVE,
    ]);

    MentorMessageFeedback::factory()->create([
        'mentor_message_id' => $assistantThree->id,
        'user_id' => $user->id,
        'rating' => MentorFeedbackRating::NEGATIVE,
        'reason' => MentorFeedbackReason::INCORRECT,
    ]);

    $this->actingAs($user);

    $response = $this->getJson(
        analyticsControllerUrl($conversation)
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.total_feedback',
            3
        )
        ->assertJsonPath(
            'data.positive_feedback',
            2
        )
        ->assertJsonPath(
            'data.negative_feedback',
            1
        );
});

/*
|--------------------------------------------------------------------------
| Feedback rate
|--------------------------------------------------------------------------
*/

it('returns the feedback rate', function () {
    $user = analyticsControllerUser();

    $conversation = analyticsControllerConversation($user);

    analyticsControllerMessage(
        $conversation,
        MentorMessageRole::ASSISTANT->value,
        'Assistant response one.',
    );

    analyticsControllerMessage(
        $conversation,
        MentorMessageRole::ASSISTANT->value,
        'Assistant response two.',
    );

    MentorMessageFeedback::factory()->create([
        'mentor_message_id' => $conversation->messages()->first()->id,
        'user_id' => $user->id,
        'rating' => MentorFeedbackRating::POSITIVE,
    ]);

    $this->actingAs($user);

    $response = $this->getJson(
        analyticsControllerUrl($conversation)
    );

    $response
        ->assertOk()
       ->assertJsonPath(
    'data.feedback_rate',
    50
);
});

/*
|--------------------------------------------------------------------------
| AI usage statistics
|--------------------------------------------------------------------------
*/

it('returns AI usage statistics', function () {
    $user = analyticsControllerUser();

    $conversation = analyticsControllerConversation($user);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'successful' => true,
        'input_tokens' => 100,
        'output_tokens' => 50,
        'total_tokens' => 150,
        'response_time_ms' => 500,
    ]);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'successful' => false,
        'input_tokens' => 80,
        'output_tokens' => 20,
        'total_tokens' => 100,
        'response_time_ms' => 700,
    ]);

    $this->actingAs($user);

    $response = $this->getJson(
        analyticsControllerUrl($conversation)
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.successful_ai_requests',
            1
        )
        ->assertJsonPath(
            'data.failed_ai_requests',
            1
        );
});

/*
|--------------------------------------------------------------------------
| Token statistics
|--------------------------------------------------------------------------
*/

it('returns token usage statistics', function () {
    $user = analyticsControllerUser();

    $conversation = analyticsControllerConversation($user);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'successful' => true,
        'input_tokens' => 100,
        'output_tokens' => 50,
        'total_tokens' => 150,
    ]);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'successful' => true,
        'input_tokens' => 200,
        'output_tokens' => 100,
        'total_tokens' => 300,
    ]);

    $this->actingAs($user);

    $response = $this->getJson(
        analyticsControllerUrl($conversation)
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.total_input_tokens',
            300
        )
        ->assertJsonPath(
            'data.total_output_tokens',
            150
        )
        ->assertJsonPath(
            'data.total_tokens',
            450
        );
});

/*
|--------------------------------------------------------------------------
| Response time
|--------------------------------------------------------------------------
*/

it('returns average response time', function () {
    $user = analyticsControllerUser();

    $conversation = analyticsControllerConversation($user);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'successful' => true,
        'response_time_ms' => 100,
    ]);

    MentorAIUsage::factory()->create([
        'user_id' => $user->id,
        'conversation_id' => $conversation->id,
        'successful' => true,
        'response_time_ms' => 300,
    ]);

    $this->actingAs($user);

    $response = $this->getJson(
        analyticsControllerUrl($conversation)
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.average_response_time',
            200
        );
});

/*
|--------------------------------------------------------------------------
| Empty conversation
|--------------------------------------------------------------------------
*/

it('returns zero statistics for a conversation with no messages', function () {
    $user = analyticsControllerUser();

    $conversation = analyticsControllerConversation($user);

    $this->actingAs($user);

    $response = $this->getJson(
        analyticsControllerUrl($conversation)
    );

    $response
        ->assertOk()
        ->assertJsonPath(
            'data.total_messages',
            0
        )
        ->assertJsonPath(
            'data.user_messages',
            0
        )
        ->assertJsonPath(
            'data.assistant_messages',
            0
        )
        ->assertJsonPath(
            'data.total_feedback',
            0
        )
        ->assertJsonPath(
            'data.feedback_rate',
            0
        );
});

/*
|--------------------------------------------------------------------------
| Authorization
|--------------------------------------------------------------------------
*/

it('does not allow another user to view conversation analytics', function () {
    $owner = analyticsControllerUser();

    $attacker = analyticsControllerUser();

    $conversation = analyticsControllerConversation($owner);

    $this->actingAs($attacker);

    $response = $this->getJson(
        analyticsControllerUrl($conversation)
    );

    $response->assertForbidden();
});