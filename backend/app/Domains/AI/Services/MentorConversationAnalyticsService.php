<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\Enums\MentorFeedbackRating;
use App\Domains\AI\Models\MentorConversation;

final class MentorConversationAnalyticsService
{
    public function calculate(
        MentorConversation $conversation,
    ): array {
        $messages = $conversation->messages()
            ->with('feedback')
            ->get();

        $totalMessages = $messages->count();

        $userMessages = $messages
            ->where('role', 'user')
            ->count();

        $assistantMessages = $messages
            ->where('role', 'assistant')
            ->count();

        $feedback = $messages
            ->pluck('feedback')
            ->filter();

        $totalFeedback = $feedback->count();

        $positiveFeedback = $feedback
            ->where(
                'rating',
                MentorFeedbackRating::POSITIVE
            )
            ->count();

        $negativeFeedback = $feedback
            ->where(
                'rating',
                MentorFeedbackRating::NEGATIVE
            )
            ->count();

        $feedbackRate = $assistantMessages > 0
            ? round(
                ($totalFeedback / $assistantMessages) * 100,
                1
            )
            : 0.0;

        $usage = $conversation->aiUsages();

        $totalAiRequests = (clone $usage)->count();

        $successfulAiRequests = (clone $usage)
            ->where('successful', true)
            ->count();

        $failedAiRequests = (clone $usage)
            ->where('successful', false)
            ->count();

        $totalInputTokens = (clone $usage)
            ->sum('input_tokens');

        $totalOutputTokens = (clone $usage)
            ->sum('output_tokens');

        $totalTokens = (clone $usage)
            ->sum('total_tokens');

        $averageResponseTime = (clone $usage)
            ->avg('response_time_ms');

        return [
            'total_messages' => $totalMessages,

            'user_messages' => $userMessages,

            'assistant_messages' => $assistantMessages,

            'total_feedback' => $totalFeedback,

            'positive_feedback' => $positiveFeedback,

            'negative_feedback' => $negativeFeedback,

            'feedback_rate' => (float) $feedbackRate,

            'total_ai_requests' => $totalAiRequests,

            'successful_ai_requests' => $successfulAiRequests,

            'failed_ai_requests' => $failedAiRequests,

            'total_input_tokens' => (int) $totalInputTokens,

            'total_output_tokens' => (int) $totalOutputTokens,

            'total_tokens' => (int) $totalTokens,

            'average_response_time' => $averageResponseTime !== null
                ? (float) $averageResponseTime
                : 0.0,
        ];
    }
}