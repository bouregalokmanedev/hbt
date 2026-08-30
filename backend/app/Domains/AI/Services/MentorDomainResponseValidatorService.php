<?php

namespace App\Domains\AI\Services;

use App\Domains\AI\DTOs\MentorGuardrailResult;

final class MentorDomainResponseValidatorService
{
    private const MIN_RESPONSE_LENGTH = 20;

    /**
     * Phrases that indicate the model did not actually answer
     * the student's educational question.
     *
     * @var array<int, string>
     */
    private const NON_ANSWER_PATTERNS = [
        'i cannot help with that',
        'i can\'t help with that',
        'i cannot answer that',
        'i can\'t answer that',
        'i don\'t know',
        'i do not know',
        'as an ai, i cannot',
        'i am unable to help',
    ];

    /**
     * Strong domain indicators.
     *
     * These are intentionally broad. The validator is not trying
     * to prove that every response is technically correct.
     *
     * @var array<int, string>
     */
    private const DOMAIN_PATTERNS = [
        'engine',
        'automotive',
        'vehicle',
        'diagnostic',
        'diagnosis',
        'ecu',
        'sensor',
        'injector',
        'ignition',
        'fuel',
        'fuel trim',
        'air-fuel',
        'air fuel',
        'maf',
        'map sensor',
        'oxygen sensor',
        'o2 sensor',
        'lambda',
        'throttle',
        'rpm',
        'misfire',
        'spark',
        'voltage',
        'current',
        'resistance',
        'multimeter',
        'oscilloscope',
        'can bus',
        'can-bus',
        'dtc',
        'obd',
        'obd-ii',
        'compression',
        'crankshaft',
        'camshaft',
        'coolant',
        'temperature',
        'pressure',
        'torque',
        'transmission',
        'lesson',
        'course',
        'module',
        'quiz',
        'learning',
        'diagnostic test',
    ];

    private const SAFE_RESPONSE =
        'I can help with HBTTronics educational and automotive learning topics. Please ask a course, lesson, or automotive diagnostic question.';

    public function validate(
        string $response,
    ): MentorGuardrailResult {
        $normalizedResponse = mb_strtolower(
            trim($response)
        );

        /*
         * Empty response.
         */
        if ($normalizedResponse === '') {
            return $this->reject(
                'The response is empty.'
            );
        }

        /*
         * Responses that are too short are unlikely to provide
         * meaningful educational value.
         */
        if (mb_strlen($normalizedResponse) < self::MIN_RESPONSE_LENGTH) {
            return $this->reject(
                'The response is too short to provide a meaningful educational answer.'
            );
        }

        /*
         * Detect obvious non-answer responses.
         */
        foreach (self::NON_ANSWER_PATTERNS as $pattern) {
            if (str_contains($normalizedResponse, $pattern)) {
                return $this->reject(
                    'The response does not provide an educational answer.'
                );
            }
        }

        /*
         * Require at least one recognizable HBTTronics educational
         * or automotive concept.
         */
        foreach (self::DOMAIN_PATTERNS as $pattern) {
            if (str_contains($normalizedResponse, $pattern)) {
                return MentorGuardrailResult::allow();
            }
        }

        return $this->reject(
            'The response does not appear to be related to an HBTTronics educational or automotive topic.'
        );
    }

    private function reject(
        string $reason,
    ): MentorGuardrailResult {
        return MentorGuardrailResult::block(
            reason: $reason,
            safeResponse: self::SAFE_RESPONSE,
        );
    }
}