<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\DTOs\MentorContext;
use App\Domains\AI\DTOs\MentorContextBudget;
use App\Domains\AI\DTOs\MentorPrompt;
use App\Domains\AI\Enums\MentorMessageRole;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Services\Prompt\MentorContextPrompt;
use App\Domains\AI\Services\Prompt\MentorSystemPrompt;

final class MentorPromptService
{
    public function __construct(
        private readonly MentorSystemPrompt $systemPrompt,
        private readonly MentorContextPrompt $contextPrompt,
        private readonly MentorConversationContextService $conversationContext,
        private readonly MentorTokenEstimator $tokenEstimator,
        private readonly MentorStudentProfileService $studentProfileService,
        private readonly MentorAdaptationService $adaptationService,
    ) {
    }

    public function build(
        MentorConversation $conversation,
        MentorContext $context,
        string $message,
    ): MentorPrompt {
        $messages = $this->buildMessages(
            $conversation,
            $context,
            $message,
        );

        return new MentorPrompt(
            $messages,
            $this->tokenEstimator->estimateMessages($messages),
        );
    }

    /**
     * @return array<int, array{
     *     role: string,
     *     content: string
     * }>
     */
    public function buildMessages(
        MentorConversation $conversation,
        MentorContext $context,
        string $message,
    ): array {
        $messages = [
            [
                'role' => MentorMessageRole::SYSTEM->value,
                'content' => $this->systemPrompt->build()
                    . "\n\n"
                    . $this->contextPrompt->build($context),
            ],
        ];

        $budget = new MentorContextBudget();

        foreach (
            $this->conversationContext->build($conversation, $budget)
            as $previousMessage
        ) {
            $messages[] = $previousMessage;
        }

        $messages[] = [
            'role' => MentorMessageRole::USER->value,
            'content' => $message,
        ];

        return $messages;
    }
}