<?php

use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Enums\MentorFeedbackReason;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Models\MentorMessageFeedback;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Resources\MentorMessageFeedbackResource;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function createMentorMessageFeedback(): MentorMessageFeedback
{
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'assistant',
        'content' => 'Fuel trim is the ECU correction applied to maintain the target air-fuel ratio.',
    ]);

    return MentorMessageFeedback::factory()->create([
        'mentor_message_id' => $message->id,
        'user_id' => $user->id,
        'rating' => MentorFeedbackRating::POSITIVE,
        'reason' => MentorFeedbackReason::HELPFUL,
        'comment' => 'This explanation was very helpful.',
        'metadata' => [
            'source' => 'mentor',
            'version' => 1,
        ],
    ]);
}

/*
|--------------------------------------------------------------------------
| Basic resource serialization
|--------------------------------------------------------------------------
*/

it('feedback resource returns feedback data', function () {
    $feedback = createMentorMessageFeedback();

    $resource = new MentorMessageFeedbackResource($feedback);

    $data = $resource->toArray(request());

    expect($data)
        ->toHaveKeys([
            'id',
            'mentor_message_id',
            'user_id',
            'rating',
            'reason',
            'comment',
            'metadata',
            'created_at',
            'updated_at',
        ]);

    expect($data['id'])
        ->toBe($feedback->id);

    expect($data['mentor_message_id'])
        ->toBe($feedback->mentor_message_id);

    expect($data['user_id'])
        ->toBe($feedback->user_id);
});

/*
|--------------------------------------------------------------------------
| Rating
|--------------------------------------------------------------------------
*/

it('feedback resource serializes rating', function () {
    $feedback = createMentorMessageFeedback();

    $resource = new MentorMessageFeedbackResource($feedback);

    $data = $resource->toArray(request());

    expect($data['rating'])
        ->toBe($feedback->rating->value);
});

/*
|--------------------------------------------------------------------------
| Reason
|--------------------------------------------------------------------------
*/

it('feedback resource serializes reason', function () {
    $feedback = createMentorMessageFeedback();

    $resource = new MentorMessageFeedbackResource($feedback);

    $data = $resource->toArray(request());

    expect($data['reason'])
        ->toBe($feedback->reason->value);
});

/*
|--------------------------------------------------------------------------
| Comment
|--------------------------------------------------------------------------
*/

it('feedback resource serializes comment', function () {
    $feedback = createMentorMessageFeedback();

    $resource = new MentorMessageFeedbackResource($feedback);

    $data = $resource->toArray(request());

    expect($data['comment'])
        ->toBe('This explanation was very helpful.');
});

/*
|--------------------------------------------------------------------------
| Metadata
|--------------------------------------------------------------------------
*/

it('feedback resource serializes metadata', function () {
    $feedback = createMentorMessageFeedback();

    $resource = new MentorMessageFeedbackResource($feedback);

    $data = $resource->toArray(request());

    expect($data['metadata'])
        ->toBe([
            'source' => 'mentor',
            'version' => 1,
        ]);
});

/*
|--------------------------------------------------------------------------
| Timestamps
|--------------------------------------------------------------------------
*/

it('feedback resource serializes timestamps', function () {
    $feedback = createMentorMessageFeedback();

    $resource = new MentorMessageFeedbackResource($feedback);

    $data = $resource->toArray(request());

    expect($data['created_at'])
        ->toBe($feedback->created_at?->toISOString());

    expect($data['updated_at'])
        ->toBe($feedback->updated_at?->toISOString());
});

/*
|--------------------------------------------------------------------------
| Nullable fields
|--------------------------------------------------------------------------
*/

it('feedback resource supports nullable reason comment and metadata', function () {
    $user = User::factory()->create();

    $conversation = MentorConversation::factory()->create([
        'user_id' => $user->id,
    ]);

    $message = MentorMessage::factory()->create([
        'mentor_conversation_id' => $conversation->id,
        'role' => 'assistant',
    ]);

    $feedback = MentorMessageFeedback::factory()->create([
        'mentor_message_id' => $message->id,
        'user_id' => $user->id,
        'rating' => MentorFeedbackRating::POSITIVE,
        'reason' => null,
        'comment' => null,
        'metadata' => null,
    ]);

    $resource = new MentorMessageFeedbackResource($feedback);

    $data = $resource->toArray(request());

    expect($data['rating'])
        ->toBe($feedback->rating->value);

    expect($data['reason'])
        ->toBeNull();

    expect($data['comment'])
        ->toBeNull();

    expect($data['metadata'])
        ->toBeNull();
});