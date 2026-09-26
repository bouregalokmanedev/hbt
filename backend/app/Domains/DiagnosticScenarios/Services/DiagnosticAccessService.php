<?php

namespace App\Domains\DiagnosticScenarios\Services;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Models\User;
use LogicException;

/**
 * Course assignment contract.
 *
 * Scenario Definition + Course Assignment + Student Attempt are three
 * separate concepts. The Diagnostic domain reports completion; the
 * Learning domain decides how that affects course progress.
 */
final class DiagnosticAccessService
{
    public function assignmentFor(
        DiagnosticScenario $scenario,
        string $courseId,
    ): ?CourseDiagnosticScenario {
        return CourseDiagnosticScenario::where('course_id', $courseId)
            ->where('diagnostic_scenario_id', $scenario->id)
            ->first();
    }

    /**
     * @throws LogicException when the student may not start a new attempt.
     */
    public function assertCanStart(
        DiagnosticScenario $scenario,
        User $user,
        ?string $courseId = null,
    ): void {
        if ($scenario->status !== DiagnosticScenarioStatus::PUBLISHED) {
            throw new LogicException('This scenario is not available.');
        }

        if ($courseId === null) {
            return;
        }

        $assignment = $this->assignmentFor($scenario, $courseId);

        if ($assignment === null) {
            // Legacy fallback: scenarios created before course assignments
            // carry a direct course_id. Accept when it matches.
            if ((string) $scenario->course_id === (string) $courseId) {
                return;
            }

            // If the scenario has explicit assignments, an unknown course is rejected.
            $hasAssignments = CourseDiagnosticScenario::where(
                'diagnostic_scenario_id',
                $scenario->id
            )->exists();

            if ($hasAssignments) {
                throw new LogicException('This scenario is not assigned to the course.');
            }

            return;
        }

        if (! $assignment->isAvailableNow()) {
            throw new LogicException('This scenario is not currently available.');
        }

        if ($assignment->max_attempts !== null) {
            $used = $scenario->attempts()->where('user_id', $user->id)->count();

            if ($used >= $assignment->max_attempts) {
                throw new LogicException('Maximum attempts for this scenario have been used.');
            }
        }
    }

    public function minScoreFor(
        DiagnosticScenario $scenario,
        ?string $courseId = null,
    ): int {
        if ($courseId !== null) {
            $assignment = $this->assignmentFor($scenario, $courseId);

            if ($assignment !== null) {
                return (int) $assignment->min_score;
            }
        }

        return (int) $scenario->passing_score;
    }
}
