<?php

namespace App\Domains\DiagnosticScenarios\Services;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticProgress;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResult;
use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Learning-side contribution of the Diagnostic domain.
 *
 * The Diagnostic domain reports "completed/passed" via events; this service
 * decides how that affects course progress. One row per (course, scenario,
 * student): best submitted score, attempt count, and completion against the
 * course assignment's own min_score (falling back to the scenario's
 * passing_score for legacy scenarios without assignments).
 */
final class DiagnosticProgressService
{
    /**
     * Recompute progress rows for every course the scenario contributes to.
     *
     * @return Collection<int, CourseDiagnosticProgress>
     */
    public function syncForResult(DiagnosticScenarioResult $result): Collection
    {
        $result->loadMissing(['scenario', 'attempt']);

        $scenario = $result->scenario;
        $userId = $result->user_id;

        $courseIds = CourseDiagnosticScenario::where('diagnostic_scenario_id', $scenario->id)
            ->pluck('course_id')
            ->all();

        // Legacy fallback: scenarios created before assignments carry course_id.
        if ($courseIds === [] && $scenario->course_id !== null) {
            $courseIds = [(string) $scenario->course_id];
        }

        return collect($courseIds)->map(
            fn (string $courseId) => $this->syncForCourse($scenario->id, $courseId, (int) $userId)
        )->values();
    }

    public function syncForCourse(string $scenarioId, string $courseId, int $userId): CourseDiagnosticProgress
    {
        $submitted = DiagnosticScenarioAttempt::where('diagnostic_scenario_id', $scenarioId)
            ->where('user_id', $userId)
            ->where('status', DiagnosticScenarioAttemptStatus::SUBMITTED);

        $attemptsCount = $submitted->count();
        $bestScore = $submitted->max('score');

        $assignment = CourseDiagnosticScenario::where('course_id', $courseId)
            ->where('diagnostic_scenario_id', $scenarioId)
            ->first();

        $threshold = $assignment !== null
            ? (int) $assignment->min_score
            : (int) (DiagnosticScenario::find($scenarioId)?->passing_score ?? 70);

        $passed = $bestScore !== null && $bestScore >= $threshold;

        $existing = CourseDiagnosticProgress::where('course_id', $courseId)
            ->where('diagnostic_scenario_id', $scenarioId)
            ->where('user_id', $userId)
            ->first();

        $completedAt = $existing?->completed_at;
        if ($passed && $completedAt === null) {
            $completedAt = now();
        }

        return CourseDiagnosticProgress::updateOrCreate(
            [
                'course_id' => $courseId,
                'diagnostic_scenario_id' => $scenarioId,
                'user_id' => $userId,
            ],
            [
                'best_score' => $bestScore,
                'attempts_count' => $attemptsCount,
                'passed' => $passed,
                'completed_at' => $passed ? $completedAt : null,
            ]
        );
    }

    /**
     * Required-diagnostics completion for a course + student.
     * Feeds course-requirement checks and final-assessment gating.
     *
     * @return array{required: int, completed: int, items: array}
     */
    public function completionForCourse(Course $course, User $user): array
    {
        $assignments = CourseDiagnosticScenario::where('course_id', $course->id)
            ->where('is_required', true)
            ->with('scenario:id,title')
            ->get();

        // Legacy fallback: required scenarios via direct course_id.
        if ($assignments->isEmpty()) {
            $assignments = $course->diagnosticScenarios()
                ->where('diagnostic_scenarios.is_required', true)
                ->get()
                ->map(fn ($scenario) => (object) [
                    'diagnostic_scenario_id' => $scenario->id,
                    'min_score' => $scenario->passing_score,
                    'scenario' => $scenario,
                ]);
        }

        $items = $assignments->map(function ($assignment) use ($course, $user) {
            $progress = CourseDiagnosticProgress::where('course_id', $course->id)
                ->where('diagnostic_scenario_id', $assignment->diagnostic_scenario_id)
                ->where('user_id', $user->id)
                ->first();

            return [
                'scenario_id' => $assignment->diagnostic_scenario_id,
                'title' => $assignment->scenario?->title,
                'min_score' => $assignment->min_score,
                'passed' => (bool) $progress?->passed,
                'best_score' => $progress?->best_score,
            ];
        })->values()->all();

        $completed = collect($items)->where('passed', true)->count();

        return [
            'required' => count($items),
            'completed' => $completed,
            'items' => $items,
        ];
    }
}
