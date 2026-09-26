<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Models\AssessmentAttempt;

final class DimensionScoringService
{
    /**
     * Question type → result dimension mapping.
     *
     * - knowledge: recall/recognition (choice, true/false, short answer)
     * - application: quantitative use (numeric)
     * - problem_solving: structured manipulation (ordering, matching)
     * - decision: scenario paths (computed by ScenarioEvaluationService)
     * - confidence: calibration (computed by AssessmentScoringService)
     */
    public const TYPE_DIMENSIONS = [
        'single_choice' => 'knowledge',
        'multiple_choice' => 'knowledge',
        'true_false' => 'knowledge',
        'short_answer' => 'knowledge',
        'long_answer' => 'knowledge',
        'numeric' => 'application',
        'ordering' => 'problem_solving',
        'matching' => 'problem_solving',
    ];

    public function dimensionFor(?string $type): ?string
    {
        if ($type === null) {
            return null;
        }

        return self::TYPE_DIMENSIONS[$type] ?? null;
    }

    /**
     * Points-weighted percentage per dimension. Dimensions with no
     * questions return null (unknown, not zero).
     *
     * @return array{knowledge: ?float, application: ?float, problem_solving: ?float}
     */
    public function dimensionScores(array $scoringResults): array
    {
        $earned = [];
        $possible = [];

        foreach ($scoringResults as $row) {
            $dimension = $this->dimensionFor($row['type'] ?? null);

            if ($dimension === null) {
                continue;
            }

            $earned[$dimension] = ($earned[$dimension] ?? 0) + ($row['points_earned'] ?? 0);
            $possible[$dimension] = ($possible[$dimension] ?? 0) + ($row['points'] ?? 0);
        }

        $scores = [];
        foreach (['knowledge', 'application', 'problem_solving'] as $dimension) {
            $scores[$dimension] = ($possible[$dimension] ?? 0) > 0
                ? round(($earned[$dimension] / $possible[$dimension]) * 100, 2)
                : null;
        }

        return $scores;
    }

    /**
     * Time efficiency: share of the allotted attempt window left unused
     * at submit, 0-100. Rewards completing within the allowance with
     * headroom; using the full allowance scores 0. Null when the
     * timestamps needed for the calculation are missing.
     */
    public function timeEfficiency(AssessmentAttempt $attempt): ?float
    {
        $started = $attempt->started_at;
        $submitted = $attempt->submitted_at;
        $expires = $attempt->expires_at;

        if (! $started || ! $submitted || ! $expires) {
            return null;
        }

        // Carbon 3 returns signed diffs by default — use absolute values.
        $allotted = abs($expires->diffInSeconds($started));

        if ($allotted <= 0) {
            return null;
        }

        $elapsed = abs($submitted->diffInSeconds($started));

        return round(max(0, min(100, (1 - ($elapsed / $allotted)) * 100)), 2);
    }
}
