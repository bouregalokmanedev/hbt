<?php

namespace App\Domains\DiagnosticScenarios\Services;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioScoringCriterion;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;

final class DiagnosticStepGradingService
{
    /**
     * Grade one step.
     *
     * Criteria-based (preferred): each scoring criterion contributes its
     * points when its rule matches. Supported evaluation types:
     * - boolean: rules {field, expected}
     * - contains: rules {field, expected} (case-insensitive substring)
     * - numeric_range: rules {field, min, max}
     * - set_match: rules {field, expected: [...]} (exact set equality)
     *
     * Legacy fallback: step configuration {correct_action, correct_component}
     * awards 10 points on match, else 0. Steps with neither award a single
     * participation point.
     *
     * @return array{points_earned: int, points_possible: int, criteria: array}
     */
    public function gradeStep(DiagnosticScenarioStep $step, array $chosen): array
    {
        $criteria = DiagnosticScenarioScoringCriterion::where('step_id', $step->id)
            ->orderBy('position')
            ->get();

        if ($criteria->isNotEmpty()) {
            $earned = 0;
            $possible = 0;
            $detail = [];

            foreach ($criteria as $criterion) {
                $possible += (int) $criterion->points;
                $passed = $this->evaluateCriterion($criterion, $chosen);

                if ($passed) {
                    $earned += (int) $criterion->points;
                }

                $detail[] = [
                    'key' => $criterion->key,
                    'passed' => $passed,
                    'points' => $passed ? (int) $criterion->points : 0,
                    'points_possible' => (int) $criterion->points,
                ];
            }

            return ['points_earned' => $earned, 'points_possible' => $possible, 'criteria' => $detail];
        }

        $multimeter = $this->evaluateMultimeterConfig($step, $chosen);

        if ($multimeter !== null) {
            return [
                'points_earned' => $multimeter ? 10 : 0,
                'points_possible' => 10,
                'criteria' => [['key' => 'multimeter_config', 'passed' => $multimeter, 'points' => $multimeter ? 10 : 0, 'points_possible' => 10]],
            ];
        }

        $legacy = $this->evaluateLegacyConfig($step, $chosen);

        if ($legacy === null) {
            return ['points_earned' => 1, 'points_possible' => 1, 'criteria' => []];
        }

        return [
            'points_earned' => $legacy ? 10 : 0,
            'points_possible' => 10,
            'criteria' => [['key' => 'legacy_config', 'passed' => $legacy, 'points' => $legacy ? 10 : 0, 'points_possible' => 10]],
        ];
    }

    public function stepPointsPossible(DiagnosticScenarioStep $step): int
    {
        $criteriaTotal = (int) DiagnosticScenarioScoringCriterion::where('step_id', $step->id)->sum('points');

        if ($criteriaTotal > 0) {
            return $criteriaTotal;
        }

        return $this->evaluateLegacyConfig($step, []) === null ? 1 : 10;
    }

    public function expectedBehavior(DiagnosticScenarioStep $step): string
    {
        $criteria = DiagnosticScenarioScoringCriterion::where('step_id', $step->id)
            ->orderBy('position')
            ->get();

        if ($criteria->isNotEmpty()) {
            return $criteria->map(fn ($c) => $c->title ?? $c->key)->implode('; ');
        }

        $config = $step->configuration ?? [];
        $parts = [];
        if (! empty($config['required_mode'])) {
            $parts[] = "Mode: {$config['required_mode']}";
        }
        if (! empty($config['red_target'])) {
            $parts[] = "Red: {$config['red_target']}";
        }
        if (! empty($config['black_target'])) {
            $parts[] = "Black: {$config['black_target']}";
        }
        if (isset($config['expected_min'], $config['expected_max'])) {
            $unit = $config['unit'] ?? '';
            $parts[] = "Reading: {$config['expected_min']}–{$config['expected_max']} {$unit}";
        }
        if (! empty($config['correct_action'])) {
            $parts[] = "Action: {$config['correct_action']}";
        }
        if (! empty($config['correct_component'])) {
            $parts[] = "Component: {$config['correct_component']}";
        }

        return $parts ? implode('; ', $parts) : 'No specific criteria';
    }

    /**
     * Multimeter configuration check. Null when the step has no multimeter setup.
     *
     * Config keys: component_ref, required_mode, red_target, black_target,
     * expected_min, expected_max, unit. Probes are OHM polarity-agnostic.
     */
    private function evaluateMultimeterConfig(DiagnosticScenarioStep $step, array $chosen): ?bool
    {
        $config = $step->configuration ?? [];
        $hasMode = ! empty($config['required_mode']);
        $hasProbes = ! empty($config['red_target']) || ! empty($config['black_target']);
        $hasRange = array_key_exists('expected_min', $config) && array_key_exists('expected_max', $config);

        if (! $hasMode && ! $hasProbes && ! $hasRange) {
            return null;
        }

        $ok = true;

        if ($hasMode) {
            $ok = $ok && (($chosen['mode'] ?? null) === $config['required_mode']);
        }

        if ($hasProbes) {
            $red = $chosen['redProbe'] ?? null;
            $black = $chosen['blackProbe'] ?? null;
            $expectedRed = $config['red_target'] ?? null;
            $expectedBlack = $config['black_target'] ?? null;
            $isOhm = ($config['required_mode'] ?? '') === 'OHM';

            if ($expectedRed !== null && $expectedBlack !== null && $isOhm) {
                $ok = $ok && (($red === $expectedRed && $black === $expectedBlack) || ($red === $expectedBlack && $black === $expectedRed));
            } else {
                if ($expectedRed !== null) {
                    $ok = $ok && ($red === $expectedRed);
                }
                if ($expectedBlack !== null) {
                    $ok = $ok && ($black === $expectedBlack);
                }
            }
        }

        if ($hasRange) {
            $raw = $chosen['reading'] ?? $chosen['measurement'] ?? null;
            $value = $this->extractNumeric($raw);

            if ($value === null) {
                $ok = false;
            } else {
                if (isset($config['expected_min']) && $value < (float) $config['expected_min']) {
                    $ok = false;
                }
                if (isset($config['expected_max']) && $value > (float) $config['expected_max']) {
                    $ok = false;
                }
            }
        }

        return $ok;
    }

    private function extractNumeric(mixed $raw): ?float
    {
        if (is_int($raw) || is_float($raw)) {
            return (float) $raw;
        }

        if (! is_string($raw) || trim($raw) === '') {
            return null;
        }

        if (preg_match('/-?\d+(?:\.\d+)?/', trim($raw), $matches) === 1) {
            return (float) $matches[0];
        }

        return null;
    }

    private function evaluateCriterion(DiagnosticScenarioScoringCriterion $criterion, array $chosen): bool
    {
        $rules = $criterion->rules ?? [];
        $type = $criterion->evaluation_type ?? 'boolean';

        return match ($type) {
            'contains' => $this->matchContains($chosen[$rules['field'] ?? ''] ?? null, $rules['expected'] ?? ''),
            'numeric_range' => $this->matchRange($chosen[$rules['field'] ?? ''] ?? null, $rules['min'] ?? null, $rules['max'] ?? null),
            'set_match' => $this->matchSet($chosen[$rules['field'] ?? ''] ?? null, $rules['expected'] ?? []),
            default => ($chosen[$rules['field'] ?? ''] ?? null) == ($rules['expected'] ?? null),
        };
    }

    private function matchContains(mixed $given, mixed $expected): bool
    {
        if (! is_string($given) || ! is_string($expected) || $expected === '') {
            return false;
        }

        return mb_stripos($given, $expected) !== false;
    }

    private function matchRange(mixed $given, mixed $min, mixed $max): bool
    {
        if (! is_numeric($given)) {
            return false;
        }

        $value = (float) $given;

        if ($min !== null && $value < (float) $min) {
            return false;
        }

        if ($max !== null && $value > (float) $max) {
            return false;
        }

        return true;
    }

    private function matchSet(mixed $given, mixed $expected): bool
    {
        $givenSet = collect((array) $given)->map(fn ($v) => (string) $v)->sort()->values()->all();
        $expectedSet = collect((array) $expected)->map(fn ($v) => (string) $v)->sort()->values()->all();

        return $givenSet === $expectedSet;
    }

    /**
     * Legacy configuration check. Null = no expectations configured.
     */
    private function evaluateLegacyConfig(DiagnosticScenarioStep $step, array $chosen): ?bool
    {
        $config = $step->configuration ?? [];
        $expectedAction = $config['correct_action'] ?? null;
        $expectedComponent = $config['correct_component'] ?? null;

        // Multimeter-only configuration (no legacy action/component) — already graded separately.
        if (! $expectedAction && ! $expectedComponent) {
            return null;
        }

        $actionMatches = $expectedAction === ($chosen['action'] ?? null);
        $componentMatches = $expectedComponent === ($chosen['component'] ?? null);

        if ($expectedAction && $expectedComponent) {
            return $actionMatches && $componentMatches;
        }

        if ($expectedAction) {
            return $actionMatches;
        }

        return $componentMatches;
    }
}
