<?php

namespace App\Domains\DiagnosticScenarios\Queries;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticProgress;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use Illuminate\Support\Facades\DB;

final class DiagnosticAnalyticsQuery
{
    /**
     * @return array{total_scenarios: int, total_attempts: int, avg_score: float|null, pass_rate: float|null, weak_steps: array}
     */
    public function overview(?string $courseId = null): array
    {
        $attempts = DiagnosticScenarioAttempt::query()
            ->where('status', DiagnosticScenarioAttemptStatus::SUBMITTED->value)
            ->when($courseId, fn ($q) => $q->whereHas('scenario', fn ($s) => $s->where('course_id', $courseId)));

        $totalAttempts = (clone $attempts)->count();
        $avgScore = $totalAttempts > 0 ? round((float) (clone $attempts)->avg('score'), 1) : null;
        $passed = (clone $attempts)->where('passed', true)->count();
        $passRate = $totalAttempts > 0 ? round($passed / $totalAttempts * 100, 1) : null;

        $weakSteps = DB::table('diagnostic_scenario_step_results as r')
            ->join('diagnostic_scenario_steps as s', 's.id', '=', 'r.diagnostic_scenario_step_id')
            ->join('diagnostic_scenario_attempts as a', 'a.id', '=', 'r.diagnostic_scenario_attempt_id')
            ->when($courseId, fn ($q) => $q->join('diagnostic_scenarios as sc', 'sc.id', '=', 's.diagnostic_scenario_id')->where('sc.course_id', $courseId))
            ->where('a.status', DiagnosticScenarioAttemptStatus::SUBMITTED->value)
            ->select('s.title as step_title', DB::raw('AVG(CASE WHEN r.is_correct THEN 1 ELSE 0 END) * 100 as accuracy'), DB::raw('COUNT(*) as attempts'))
            ->groupBy('s.id', 's.title')
            ->having('attempts', '>=', 3)
            ->orderBy('accuracy')
            ->limit(5)
            ->get()
            ->map(fn ($row) => ['step' => $row->step_title, 'accuracy' => round((float) $row->accuracy, 1), 'attempts' => (int) $row->attempts])
            ->all();

        $totalScenarios = DB::table('diagnostic_scenarios')
            ->when($courseId, fn ($q) => $q->where('course_id', $courseId))
            ->where('status', 'published')
            ->count();

        return [
            'total_scenarios' => $totalScenarios,
            'total_attempts' => $totalAttempts,
            'avg_score' => $avgScore,
            'pass_rate' => $passRate,
            'weak_steps' => $weakSteps,
        ];
    }

    /**
     * Per-course diagnostics completion for a student.
     *
     * @return array{required: int, completed: int, required_completion_rate: float|null}
     */
    public function studentCourseCompletion(string $courseId, int $userId): array
    {
        $required = CourseDiagnosticProgress::where('course_id', $courseId)->where('user_id', $userId)->count();
        $completed = CourseDiagnosticProgress::where('course_id', $courseId)->where('user_id', $userId)->where('passed', true)->count();
        // Distinguish "no required diagnostics" (null) from 0% completion.
        $requiredRows = DB::table('course_diagnostic_scenarios')->where('course_id', $courseId)->where('is_required', true)->count();
        if ($requiredRows === 0 && DB::table('diagnostic_scenarios')->where('course_id', $courseId)->where('is_required', true)->count() === 0) {
            return ['required' => 0, 'completed' => 0, 'required_completion_rate' => null];
        }
        $rate = $required > 0 ? round($completed / $required * 100, 1) : null;

        return ['required' => $required, 'completed' => $completed, 'required_completion_rate' => $rate];
    }
}
