<?php

namespace App\Domains\AI\Contracts;

use App\Domains\AI\DTOs\MentorAIResponse;
use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\DTOs\MentorAIStreamResponse;
use App\Domains\AI\Models\MentorConversation;

interface MentorAIProvider
{
    public function respond(
        MentorConversation $conversation,
        MentorContext $context,
        string $message,
    ): MentorAIResponse;

public function stream(
    MentorConversation $conversation,
    MentorContext $context,
    string $message,
): MentorAIStreamResponse;
}