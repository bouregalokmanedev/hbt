<?php

namespace App\Domains\AI\Actions;

use App\Domains\AI\Contracts\MentorAIProvider;
use App\Domains\AI\DTOs\MentorAIStreamResponse;
use App\Domains\AI\Enums\MentorAIRequestType;
use App\Domains\AI\Enums\MentorMessageRole;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Services\MentorContextService;
use App\Domains\AI\Services\MentorUsageLimitService;
use App\Domains\AI\Services\MentorUsageService;
use App\Domains\AI\Services\MentorInputGuardrailService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;
use Throwable;

final class StreamMentorMessageAction
{
    public function __construct(
        private readonly MentorAIProvider $provider,
        private readonly MentorContextService $contextService,
        private readonly MentorUsageLimitService $usageLimitService,
        private readonly MentorUsageService $usageService,
        private readonly MentorInputGuardrailService $inputGuardrail,
    ) {
    }

    public function execute(
        MentorConversation $conversation,
        string $message,
    ): MentorAIStreamResponse {
        Gate::authorize('view', $conversation);

        if ($conversation->status->value !== 'active') {
            abort(
                422,
                'This mentor conversation is not active.'
            );
        }

        $user = auth()->user();

        if ($user === null) {
            throw new AuthorizationException(
                'Authentication is required.'
            );
        }

        $guardrail = $this->inputGuardrail->check($message);

        if (! $guardrail->allowed) {
            return $this->safeGuardrailStream($conversation, $message, $guardrail);
        }

        if (! $this->usageLimitService->canMakeRequest($user)) {
            abort(
                429,
                'AI mentor usage limit reached. Please try again later.'
            );
        }

        /*
         * ---------------------------------------------------------
         * PERSIST USER MESSAGE
         * ---------------------------------------------------------
         */

        $conversation->messages()->create([
            'role' => MentorMessageRole::USER,
            'content' => $message,
            'metadata' => [
                'message_type' => 'stream',
            ],
        ]);

        /*
         * ---------------------------------------------------------
         * BUILD MENTOR CONTEXT
         * ---------------------------------------------------------
         */

        $context = $this->contextService->build(
    user: $user,
    courseId: $conversation->course_id,
    lessonId: $conversation->lesson_id,
    query: $message,
);

        /*
         * ---------------------------------------------------------
         * START PROVIDER STREAM
         * ---------------------------------------------------------
         */

        $response = $this->provider->stream(
            $conversation,
            $context,
            $message,
        );

        return new MentorAIStreamResponse(
            chunks: $this->wrapStreamWithPersistenceAndUsage(
                response: $response,
                conversation: $conversation,
                user: $user,
            ),
            provider: $response->provider,
            model: $response->model,
            requestId: $response->requestId,
            finishReason: $response->finishReason,
            promptTokens: $response->promptTokens,
            completionTokens: $response->completionTokens,
            totalTokens: $response->totalTokens,
            responseTimeMs: $response->responseTimeMs,
        );
    }

    /**
     * Stream provider chunks while accumulating the final
     * assistant response.
     *
     * The assistant message is persisted only after the
     * provider stream completes successfully.
     */
    private function wrapStreamWithPersistenceAndUsage(
        MentorAIStreamResponse $response,
        MentorConversation $conversation,
        mixed $user,
    ): \Generator {
        $startedAt = hrtime(true);

        $assistantContent = '';

        try {
            foreach ($response->chunks as $chunk) {
                $assistantContent .= $chunk;

                yield $chunk;
            }

            /*
             * -----------------------------------------------------
             * PROVIDER STREAM COMPLETED SUCCESSFULLY
             * -----------------------------------------------------
             */

            $providerDurationMs = (int) round(
                (hrtime(true) - $startedAt) / 1_000_000
            );

            $provider = $response->provider
                ?? config('services.ai.provider', 'openai');

            $model = $response->model
                ?? config('services.openai.model', 'gpt-4o-mini');

            /*
             * -----------------------------------------------------
             * PERSIST ASSISTANT MESSAGE
             * -----------------------------------------------------
             */

            $conversation->messages()->create([
                'role' => MentorMessageRole::ASSISTANT,
                'content' => $assistantContent,
                'metadata' => [
                    'message_type' => 'stream',
                    'provider' => $provider,
                    'model' => $model,
                    'request_id' => $response->requestId,
                    'finish_reason' => $response->finishReason,
                    'prompt_tokens' => $response->promptTokens,
                    'completion_tokens' => $response->completionTokens,
                    'total_tokens' => $response->totalTokens,
                    'response_time_ms' => $response->responseTimeMs
                        ?? $providerDurationMs,
                ],
            ]);

            $conversation->forceFill([
                'last_message_at' => now(),
            ])->save();

            /*
             * -----------------------------------------------------
             * RECORD SUCCESSFUL USAGE
             * -----------------------------------------------------
             */

            $this->usageService->record(
                user: $user,
                requestType: MentorAIRequestType::STREAM,
                provider: $provider,
                model: $model,
                inputTokens: $response->promptTokens ?? 0,
                outputTokens: $response->completionTokens ?? 0,
                totalTokens: $response->totalTokens ?? 0,
                responseTimeMs: $response->responseTimeMs
                    ?? $providerDurationMs,
                courseId: $conversation->course_id,
                conversationId: $conversation->id,
            );
        } catch (Throwable $exception) {
            /*
             * -----------------------------------------------------
             * STREAM FAILED
             * -----------------------------------------------------
             */

            $provider = $response->provider
                ?? config('services.ai.provider', 'openai');

            $model = $response->model
                ?? config('services.openai.model', 'gpt-4o-mini');

            $providerDurationMs = (int) round(
                (hrtime(true) - $startedAt) / 1_000_000
            );

            $this->usageService->recordFailure(
                user: $user,
                requestType: MentorAIRequestType::STREAM,
                provider: $provider,
                model: $model,
                responseTimeMs: $response->responseTimeMs
                    ?? $providerDurationMs,
                failureReason: $exception->getMessage(),
                courseId: $conversation->course_id,
                conversationId: $conversation->id,
            );

            /*
             * IMPORTANT:
             *
             * We deliberately do NOT persist $assistantContent here.
             *
             * A partial AI response should never become a completed
             * assistant message.
             */

            throw $exception;
        }
    }

    private function safeGuardrailStream(
        MentorConversation $conversation,
        string $message,
        \App\Domains\AI\DTOs\MentorGuardrailResult $guardrail,
    ): MentorAIStreamResponse {
        $conversation->messages()->create([
            'role' => MentorMessageRole::USER,
            'content' => $message,
            'metadata' => ['guardrail_action' => $guardrail->action],
        ]);

        $content = $guardrail->safeResponse
            ?? 'I cannot help with that request.';

        $conversation->messages()->create([
            'role' => MentorMessageRole::ASSISTANT,
            'content' => $content,
            'metadata' => [
                'response_type' => 'guardrail',
                'final_response_source' => 'input_guardrail',
            ],
        ]);

        $conversation->forceFill(['last_message_at' => now()])->save();

        return new MentorAIStreamResponse(
            chunks: (function () use ($content): \Generator {
                yield $content;
            })(),
            provider: 'application',
            model: 'guardrail',
            finishReason: 'safety',
        );
    }
}
