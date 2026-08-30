<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\DTOs\MentorContextBudget;
use App\Domains\AI\Models\MentorConversation;

final class MentorConversationContextService
{
    public function __construct(
        private readonly MentorTokenEstimator $tokens,
    ) {
    }

    public function recentMessages(
        MentorConversation $conversation,
        int $maximumTokens,
    ): array {
        $messages = [];

        $remaining = $maximumTokens;

        $history = $conversation->messages()
            ->orderByDesc('id')
            ->get();

        foreach ($history as $message) {
            $estimated = $this->tokens->estimate(
                $message->content
            );

            if ($estimated > $remaining) {
                break;
            }

            array_unshift($messages, [
                'role' => $message->role->value,
                'content' => $message->content,
            ]);

            $remaining -= $estimated;
        }

        return $messages;
    }

    public function build(
        MentorConversation $conversation,
        MentorContextBudget $budget,
    ): array {
        return $this->recentMessages(
            $conversation,
            $budget->conversationTokens
        );
    }
}