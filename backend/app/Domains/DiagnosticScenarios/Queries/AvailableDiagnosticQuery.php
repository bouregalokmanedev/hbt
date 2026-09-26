<?php

namespace App\Domains\DiagnosticScenarios\Queries;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

/**
 * Student Diagnostic Hub data: available / in-progress / completed / locked.
 */
final class AvailableDiagnosticQuery
{
    /**
     * @return Collection<int, array>
     */
    public function forStudent(User $user, ?string $courseId = null): Collection
    {
        $query = DiagnosticScenario::query()
            ->with(['course:id,title', 'courseAssignments'])
            ->withCount('steps')
            ->where('status', DiagnosticScenarioStatus::PUBLISHED)
            ->when($courseId !== null, fn ($q) => $q->where('course_id', $courseId));

        // Only the latest version in each supersession chain is listed.
        // Attempts pinned to older versions still resolve via their scenario row.
        // Guard for pgsql deployments where the versioning migration hasn't run yet.
        if (Schema::hasColumn('diagnostic_scenarios', 'supersedes_id')) {
            $query->whereNotExists(function ($q) {
                $q->selectRaw('1')
                    ->from('diagnostic_scenarios as newer')
                    ->whereColumn('newer.supersedes_id', 'diagnostic_scenarios.id');
            });
        }

        $scenarios = $query
            ->whereHas('course.enrollments', fn ($q) => $q->where('user_id', $user->id))
            ->orderBy('position')
            ->get();

        return $scenarios->map(function (DiagnosticScenario $scenario) use ($user) {
            $best = $scenario->attempts()
                ->where('user_id', $user->id)
                ->where('status', DiagnosticScenarioAttemptStatus::SUBMITTED)
                ->orderByDesc('score')
                ->first();

            $inProgress = $scenario->attempts()
                ->where('user_id', $user->id)
                ->where('status', DiagnosticScenarioAttemptStatus::IN_PROGRESS)
                ->first();

            $assignment = $scenario->courseAssignments->first();

            return [
                'id' => $scenario->id,
                'title' => $scenario->title,
                'description' => $scenario->description,
                'version' => $scenario->version ?? 1,
                'course' => $scenario->course ? ['id' => $scenario->course->id, 'title' => $scenario->course->title] : null,
                'passing_score' => $scenario->passing_score,
                'time_limit' => $scenario->time_limit,
                'is_required' => $assignment?->is_required ?? $scenario->is_required,
                'min_score' => $assignment?->min_score ?? $scenario->passing_score,
                'max_attempts' => $assignment?->max_attempts,
                'attempts_used' => $scenario->attempts()->where('user_id', $user->id)->count(),
                'steps_count' => $scenario->steps_count,
                'completed' => $best !== null && $best->passed,
                'best_score' => $best?->score,
                'in_progress_attempt_id' => $inProgress?->id,
                'state' => $this->state($best, $inProgress),
            ];
        })->values();
    }

    private function state(?object $best, ?object $inProgress): string
    {
        if ($best !== null && (bool) $best->passed) {
            return 'completed';
        }

        if ($inProgress !== null) {
            return 'in_progress';
        }

        return 'available';
    }
}
