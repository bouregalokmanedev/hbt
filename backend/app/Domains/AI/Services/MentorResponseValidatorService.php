<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\DTOs\MentorGuardrailResult;

final class MentorResponseValidatorService
{
    private const MAX_RESPONSE_LENGTH = 12000;

    /**
     * @var array<int, string>
     */
    private const BLOCKED_PATTERNS = [
        'system prompt',
        'hidden instructions',
        'internal instructions',
        'confidential instructions',
    ];

    public function validate(
        string $response,
    ): MentorGuardrailResult {
        $normalizedResponse = trim($response);

        if ($normalizedResponse === '') {
            return MentorGuardrailResult::block(
                reason: 'The mentor produced an empty response.',
                safeResponse: $this->safeResponse(),
            );
        }

        if (mb_strlen($normalizedResponse) > self::MAX_RESPONSE_LENGTH) {
            return MentorGuardrailResult::block(
                reason: 'The mentor response exceeds the allowed length.',
                safeResponse: $this->safeResponse(),
            );
        }

        $lowercaseResponse = mb_strtolower(
            $normalizedResponse
        );

        foreach (self::BLOCKED_PATTERNS as $pattern) {
            if (str_contains($lowercaseResponse, $pattern)) {
                return MentorGuardrailResult::block(
                    reason: 'The mentor response contains restricted internal information.',
                    safeResponse: $this->safeResponse(),
                );
            }
        }

        return MentorGuardrailResult::allow();
    }

    private function safeResponse(): string
    {
        return 'I could not safely generate a response to that request. Please ask your mentor about an HBTTronics educational or automotive learning topic.';
    }
}