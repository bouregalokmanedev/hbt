<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\DTOs\MentorGuardrailResult;

final class MentorOutputGuardrailService
{
    /**
     * @var array<int, string>
     */
    private const BLOCKED_PATTERNS = [
        'system prompt',
        'hidden instructions',
        'internal instructions',
        'confidential instructions',
    ];

    public function check(
        string $response,
    ): MentorGuardrailResult {
        $normalizedResponse = mb_strtolower(
            trim($response)
        );

        foreach (self::BLOCKED_PATTERNS as $pattern) {
            if (str_contains($normalizedResponse, $pattern)) {
                return MentorGuardrailResult::block(
                    reason: 'Unsafe mentor output detected.',
                    safeResponse: 'I can help with HBTTronics educational and automotive learning topics, but I cannot provide hidden system instructions or internal configuration.',
                );
            }
        }

        return MentorGuardrailResult::allow();
    }
}