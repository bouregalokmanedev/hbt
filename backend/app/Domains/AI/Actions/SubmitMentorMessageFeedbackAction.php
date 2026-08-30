<?php

namespace App\Domains\AI\Actions;

use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Models\MentorMessageFeedback;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use LogicException;

final class SubmitMentorMessageFeedbackAction
{
    public function execute(
        MentorMessage $message,
        User $user,
        MentorFeedbackRating $rating,
        ?string $reason = null,
        ?string $comment = null,
    ): MentorMessageFeedback {
        /*
         * ---------------------------------------------------------
         * VERIFY MESSAGE OWNERSHIP
         * ---------------------------------------------------------
         */

        $conversation = $message->conversation;

        if ($conversation === null) {
            throw new LogicException(
                'The mentor message does not belong to a conversation.'
            );
        }

        if ((int) $conversation->user_id !== (int) $user->id) {
            throw new AuthorizationException(
                'You are not allowed to provide feedback for this message.'
            );
        }

        /*
         * ---------------------------------------------------------
         * ONLY ASSISTANT MESSAGES CAN RECEIVE FEEDBACK
         * ---------------------------------------------------------
         */

        if ($message->role->value !== 'assistant') {
            throw new LogicException(
                'Only assistant messages can receive feedback.'
            );
        }

        /*
         * ---------------------------------------------------------
         * CREATE OR UPDATE FEEDBACK
         * ---------------------------------------------------------
         */

        return DB::transaction(function () use (
            $message,
            $user,
            $rating,
            $reason,
            $comment,
        ) {
            return MentorMessageFeedback::query()->updateOrCreate(
                [
                    'mentor_message_id' => $message->id,
                    'user_id' => $user->id,
                ],
                [
                    'rating' => $rating,
                    'reason' => $reason,
                    'comment' => $comment,
                ],
            );
        });
    }
}