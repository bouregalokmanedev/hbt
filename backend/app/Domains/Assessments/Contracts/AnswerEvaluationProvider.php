<?php

namespace App\Domains\Assessments\Contracts;

/**
 * Grades a free-text answer against a rubric.
 *
 * Implementations must never throw for transport/model failures —
 * return an unavailable result instead so submit can degrade to
 * human review. Only programmer errors (malformed rubric) throw.
 */
interface AnswerEvaluationProvider
{
    /**
     * @param array<int, array{key: string, description: string, points: int}> $rubric
     * @return array{available: bool, fraction: float, criteria: array, feedback: string}
     */
    public function evaluate(
        string $question,
        string $answer,
        array $rubric,
        ?string $sampleAnswer = null,
    ): array;
}
