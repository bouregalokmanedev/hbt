<?php

namespace App\Domains\AI\Services\Prompt;

use App\Domains\AI\Models\MentorConversation;

final class MentorConversationPrompt
{
    /**
     * @return array<int, array{
     *     role: string,
     *     content: string
     * }>
     */
    public function build(MentorConversation $conversation): array
    {
        return $conversation->messages()
            ->orderBy('id')
            ->get()
            ->map(fn ($message) => [
                'role' => $message->role->value,
                'content' => $message->content,
            ])
            ->values()
            ->all();
    }
}