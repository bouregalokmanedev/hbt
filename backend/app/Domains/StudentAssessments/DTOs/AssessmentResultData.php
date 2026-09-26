<?php

namespace App\Domains\StudentAssessments\DTOs;

use App\Domains\StudentAssessments\Enums\ProficiencyLevel;

final class AssessmentResultData
{
    public function __construct(
        public readonly string $attemptId,
        public readonly float $score,
        public readonly float $percentage,
        public readonly bool $passed,
        public readonly ProficiencyLevel $proficiencyLevel,
        public readonly ?float $knowledgeScore = null,
        public readonly ?float $applicationScore = null,
        public readonly ?float $decisionScore = null,
        public readonly ?float $problemSolvingScore = null,
        public readonly array $competencyResults = [],
        public readonly array $evidence = [],
    ) {}

    public static function fromScoring(array $scoring, ProficiencyLevel $level): self
    {
        return new self(
            attemptId: $scoring['attempt_id'] ?? '',
            score: (float) ($scoring['score'] ?? 0),
            percentage: (float) ($scoring['score'] ?? 0),
            passed: (bool) ($scoring['passed'] ?? false),
            proficiencyLevel: $level,
            evidence: $scoring['evidence'] ?? [],
        );
    }
}
