<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\Enums\MentorAIRequestType;
use App\Domains\AI\Models\MentorAIUsage;
use App\Models\User;
use Carbon\CarbonInterface;

final class MentorUsageService
{
    public function record(
        User $user,
        MentorAIRequestType $requestType,
        string $provider,
        string $model,
        int $inputTokens = 0,
        int $outputTokens = 0,
        int $totalTokens = 0,
        ?int $responseTimeMs = null,
        mixed $courseId = null,
        mixed $conversationId = null,
    ): MentorAIUsage {
        return MentorAIUsage::create([
            'user_id' => $user->id,
            'course_id' => $courseId,
            'conversation_id' => $conversationId,
            'provider' => $provider,
            'model' => $model,
            'request_type' => $requestType,
            'input_tokens' => max(0, $inputTokens),
            'output_tokens' => max(0, $outputTokens),
            'total_tokens' => max(0, $totalTokens),
            'response_time_ms' => $responseTimeMs,
            'successful' => true,
            'failure_reason' => null,
        ]);
    }

    public function recordFailure(
        User $user,
        MentorAIRequestType $requestType,
        string $provider,
        string $model,
        ?int $responseTimeMs = null,
        ?string $failureReason = null,
        mixed $courseId = null,
        mixed $conversationId = null,
    ): MentorAIUsage {
        return MentorAIUsage::create([
            'user_id' => $user->id,
            'course_id' => $courseId,
            'conversation_id' => $conversationId,
            'provider' => $provider,
            'model' => $model,
            'request_type' => $requestType,
            'input_tokens' => 0,
            'output_tokens' => 0,
            'total_tokens' => 0,
            'response_time_ms' => $responseTimeMs,
            'successful' => false,
            'failure_reason' => $failureReason,
        ]);
    }

    public function totalTokens(
        User $user,
        mixed $courseId = null,
        ?CarbonInterface $from = null,
        ?CarbonInterface $until = null,
    ): int {
        return $this->query(
            $user,
            $courseId,
            $from,
            $until,
        )->sum('total_tokens');
    }

    public function requestCount(
        User $user,
        mixed $courseId = null,
        ?CarbonInterface $from = null,
        ?CarbonInterface $until = null,
    ): int {
        return $this->query(
            $user,
            $courseId,
            $from,
            $until,
        )->count();
    }

    private function query(
        User $user,
        mixed $courseId = null,
        ?CarbonInterface $from = null,
        ?CarbonInterface $until = null,
    ) {
        return MentorAIUsage::query()
            ->where('user_id', $user->id)
            ->when(
                $courseId !== null,
                fn ($query) => $query->where(
                    'course_id',
                    $courseId,
                ),
            )
            ->when(
                $from !== null,
                fn ($query) => $query->where(
                    'created_at',
                    '>=',
                    $from,
                ),
            )
            ->when(
                $until !== null,
                fn ($query) => $query->where(
                    'created_at',
                    '<=',
                    $until,
                ),
            );
    }
}