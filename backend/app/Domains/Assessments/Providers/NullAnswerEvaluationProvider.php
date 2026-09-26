<?php

namespace App\Domains\Assessments\Providers;

use App\Domains\Assessments\Contracts\AnswerEvaluationProvider;

final class NullAnswerEvaluationProvider implements AnswerEvaluationProvider
{
    public function evaluate(
        string $question,
        string $answer,
        array $rubric,
        ?string $sampleAnswer = null,
    ): array {
        return [
            'available' => false,
            'fraction' => 0.0,
            'criteria' => [],
            'feedback' => 'Awaiting review.',
        ];
    }
}
