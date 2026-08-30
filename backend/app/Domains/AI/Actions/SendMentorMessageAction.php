<?php

namespace App\Domains\AI\Actions;

use App\Domains\AI\Contracts\MentorAIProvider;
use App\Domains\AI\Enums\MentorAIRequestType;
use App\Domains\AI\Enums\MentorConversationStatus;
use App\Domains\AI\Enums\MentorMessageRole;
use App\Domains\AI\Models\MentorConversation;
use App\Domains\AI\Models\MentorMessage;
use App\Domains\AI\Services\MentorContextService;
use App\Domains\AI\Services\MentorDomainResponseValidatorService;
use App\Domains\AI\Services\MentorInputGuardrailService;
use App\Domains\AI\Services\MentorOutputGuardrailService;
use App\Domains\AI\Services\MentorResponseValidatorService;
use App\Domains\AI\Services\MentorUsageService;
use App\Domains\AI\Services\MentorUsageLimitService;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

final class SendMentorMessageAction
{
    public function __construct(
        private readonly MentorAIProvider $aiProvider,
        private readonly MentorUsageService $usageService,
        private readonly MentorContextService $contextService,
        private readonly MentorUsageLimitService $usageLimitService,
        private readonly MentorInputGuardrailService $inputGuardrail,
        private readonly MentorOutputGuardrailService $outputGuardrail,
        private readonly MentorResponseValidatorService $responseValidator,
        private readonly MentorDomainResponseValidatorService $domainResponseValidator,
    ) {
    }

    public function execute(
        MentorConversation $conversation,
        User $user,
        string $message,
    ): MentorMessage {
        /*
         * ---------------------------------------------------------
         * VERIFY CONVERSATION OWNERSHIP
         * ---------------------------------------------------------
         */
        if ((int) $conversation->user_id !== (int) $user->id) {
            throw new LogicException(
                'The user does not own this mentor conversation.'
            );
        }

        /*
         * ---------------------------------------------------------
         * VERIFY CONVERSATION STATUS
         * ---------------------------------------------------------
         */
        if ($conversation->status !== MentorConversationStatus::ACTIVE) {
            throw new LogicException(
                'The mentor conversation is not active.'
            );
        }

        /*
         * ---------------------------------------------------------
         * INPUT GUARDRAIL
         * ---------------------------------------------------------
         *
         * The input guardrail must run before:
         *
         * - context building
         * - AI provider call
         * - usage recording
         */
        $guardrail = $this->inputGuardrail->check($message);

        if (!$guardrail->allowed) {

            return DB::transaction(function () use (
                $conversation,
                $message,
                $guardrail,
            ) {
                /*
                 * Persist the blocked user message.
                 */
                $conversation->messages()->create([
                    'role' => MentorMessageRole::USER,
                    'content' => $message,
                    'metadata' => [
                        'guardrail_action' => $guardrail->action,
                    ],
                ]);

                /*
                 * Persist the safe application-generated response.
                 *
                 * No AI provider is called and no AI usage is recorded.
                 */
                return $conversation->messages()->create([
                    'role' => MentorMessageRole::ASSISTANT,
                    'content' => $guardrail->safeResponse
                        ?? 'I cannot help with that request.',
                    'metadata' => [
                        'response_type' => 'guardrail',
                        'final_response_source' => 'input_guardrail',

                        'guardrail' => [
                            'action' => $guardrail->action,
                            'reason' => $guardrail->reason,
                        ],
                    ],
                ]);
            });
        }


        /*
 * ---------------------------------------------------------
 * AI USAGE LIMIT
 * ---------------------------------------------------------
 *
 * Guardrail-blocked messages do not consume AI usage.
 * Therefore the limit is checked only after the input
 * guardrail has allowed the request.
 */
if (!$this->usageLimitService->canMakeRequest($user)) {
    abort(
        429,
        'AI mentor usage limit reached. Please try again later.'
    );
}
        /*
         * ---------------------------------------------------------
         * AI GENERATION + PERSISTENCE
         * ---------------------------------------------------------
         */
        return DB::transaction(function () use (
            $conversation,
            $user,
            $message,
        ) {
            /*
             * -----------------------------------------------------
             * BUILD MENTOR CONTEXT
             * -----------------------------------------------------
             */
            $context = $this->contextService->build(
    user: $user,
    courseId: $conversation->course_id,
    lessonId: $conversation->lesson_id,
    query: $message,
);
            /*
             * -----------------------------------------------------
             * CALL AI PROVIDER
             * -----------------------------------------------------
             *
             * The provider returns a MentorAIResponse DTO.
             */
            $providerStartedAt = hrtime(true);

            $response = $this->aiProvider->respond(
                conversation: $conversation,
                context: $context,
                message: $message,
            );

            $providerDurationMs = (int) round(
                (hrtime(true) - $providerStartedAt) / 1_000_000
            );

            /*
             * -----------------------------------------------------
             * AI USAGE
             * -----------------------------------------------------
             *
             * The provider/model/token information comes from the
             * MentorAIResponse DTO.
             *
             * The provider is required to be a string by
             * MentorUsageService, so use a safe application-level
             * fallback when a mocked/test response does not provide it.
             */
            $provider = $response->provider
                ?? config('services.ai.provider', 'openai');

            $model = $response->model
                ?? config('services.openai.model', 'gpt-4o-mini');

            $this->usageService->record(
                user: $user,
                requestType: MentorAIRequestType::MESSAGE,
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

            /*
             * -----------------------------------------------------
             * EXTRACT RESPONSE CONTENT
             * -----------------------------------------------------
             */
            $responseContent = $response->content;

            /*
             * -----------------------------------------------------
             * AI METADATA
             * -----------------------------------------------------
             *
             * Use the actual DTO model rather than reading the
             * configuration again.
             *
             * The raw AI response is never stored in metadata.
             */
            $aiMetadata = [
                'model' => $model,
                'response_length' => strlen($responseContent),
                'response_time_ms' => $providerDurationMs,
            ];

            /*
             * -----------------------------------------------------
             * VALIDATION METADATA
             * -----------------------------------------------------
             */
            $validationMetadata = [
                'output_guardrail' => 'not_checked',
                'response_validator' => 'not_checked',
                'domain_validator' => 'not_checked',
            ];

            /*
             * -----------------------------------------------------
             * FINAL RESPONSE
             * -----------------------------------------------------
             */
            $finalResponse = $responseContent;
            $finalResponseSource = 'ai';

            /*
             * -----------------------------------------------------
             * 1. OUTPUT GUARDRAIL
             * -----------------------------------------------------
             */
            $outputGuardrail = $this->outputGuardrail->check(
                $responseContent
            );

            if (!$outputGuardrail->allowed) {
                $validationMetadata['output_guardrail'] = 'blocked';

                $finalResponse = $outputGuardrail->safeResponse
                    ?? 'I can help with HBTTronics educational and automotive learning topics, but I cannot provide hidden system instructions or internal configuration.';

                $finalResponseSource = 'output_guardrail';
            } else {
                $validationMetadata['output_guardrail'] = 'allowed';

                /*
                 * -------------------------------------------------
                 * 2. GENERAL RESPONSE VALIDATOR
                 * -------------------------------------------------
                 */
                $validation = $this->responseValidator->validate(
                    $responseContent
                );

                if (!$validation->allowed) {
                    $validationMetadata['response_validator'] = 'blocked';

                    $finalResponse = $validation->safeResponse
                        ?? 'I could not safely generate a response to that request. Please ask your mentor about an HBTTronics educational or automotive learning topic.';

                    $finalResponseSource = 'response_validator';
                } else {
                    $validationMetadata['response_validator'] = 'allowed';

                    /*
                     * -------------------------------------------------
                     * 3. DOMAIN RESPONSE VALIDATOR
                     * -------------------------------------------------
                     */
                    $domainValidation = $this->domainResponseValidator->validate(
                        $responseContent
                    );

                    if (!$domainValidation->allowed) {
                        $validationMetadata['domain_validator'] = 'blocked';

                        $finalResponse = $domainValidation->safeResponse
                            ?? 'I can help with HBTTronics educational and automotive learning topics. Please ask a course, lesson, or automotive diagnostic question.';

                        $finalResponseSource = 'domain_validator';
                    } else {
                        $validationMetadata['domain_validator'] = 'allowed';

                        /*
                         * All validation layers passed.
                         */
                        $finalResponse = $responseContent;
                        $finalResponseSource = 'ai';
                    }
                }
            }

            /*
             * -----------------------------------------------------
             * PERSIST USER MESSAGE
             * -----------------------------------------------------
             */
            $conversation->messages()->create([
                'role' => MentorMessageRole::USER,
                'content' => $message,
                'metadata' => null,
            ]);

            /*
             * -----------------------------------------------------
             * BUILD ASSISTANT METADATA
             * -----------------------------------------------------
             */
            $metadata = [
                'response_type' => 'ai',

                'model' => $aiMetadata['model'],
                'response_length' => $aiMetadata['response_length'],
                'response_time_ms' => $aiMetadata['response_time_ms'],

                'output_guardrail' => $validationMetadata['output_guardrail'],
                'response_validator' => $validationMetadata['response_validator'],
                'domain_validator' => $validationMetadata['domain_validator'],

                'final_response_source' => $finalResponseSource,
            ];

            /*
             * -----------------------------------------------------
             * VALIDATION LAYER METADATA
             * -----------------------------------------------------
             */
            if ($finalResponseSource === 'output_guardrail') {
                $metadata['guardrail_layer'] = 'output';
            }

            if ($finalResponseSource === 'response_validator') {
                $metadata['validator_layer'] = 'general';
            }

            if ($finalResponseSource === 'domain_validator') {
                $metadata['validator_layer'] = 'domain';
            }

            /*
             * -----------------------------------------------------
             * PERSIST ASSISTANT MESSAGE
             * -----------------------------------------------------
             *
             * IMPORTANT:
             *
             * Never persist the raw unsafe AI response.
             *
             * The content column contains only the final response
             * that passed through the validation pipeline.
             */
            $assistantMessage = $conversation->messages()->create([
                'role' => MentorMessageRole::ASSISTANT,
                'content' => $finalResponse,
                'metadata' => $metadata,
            ]);

            $conversation->forceFill([
                'last_message_at' => now(),
            ])->save();

            return $assistantMessage;
        });
    }
}
