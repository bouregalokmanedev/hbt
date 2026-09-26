<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Enums\IntegrityEventType;
use App\Domains\StudentAssessments\Models\StudentAssessmentIntegrityEvent;
use App\Models\User;

final class IntegrityEnforcementService
{
    public function __construct(
        private readonly IntegrityAnalysisService $analysis,
    ) {}

    /**
     * Evaluate integrity signals and act on them.
     *
     * Policy (thresholds in config/assessments.php):
     * - tab/window blurs at the switch limit → block + expire
     * - high overall risk → block + expire
     * - any high-severity event or medium risk → warn (no status change)
     *
     * Only IN_PROGRESS attempts are ever touched; finalized attempts
     * (submitted/passed/failed) are analyzed read-only.
     *
     * @return array{action: string, blocked: bool, tab_switch_count: int, risk_score: int, risk_level: string}
     */
    public function enforce(AssessmentAttempt $attempt, User $user): array
    {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        $attempt = $attempt->fresh() ?? $attempt;
        $summary = $this->analysis->getIntegritySummary($attempt);
        $limit = (int) config('assessments.attempt.tab_switch_limit', 3);

        // Keep the legacy counter truthful: it mirrors recorded blurs.
        if ($attempt->tab_switch_count !== $summary['event_summary']['tab_switches']) {
            $attempt->update(['tab_switch_count' => $summary['event_summary']['tab_switches']]);
        }

        if ($attempt->status !== AssessmentAttemptStatus::IN_PROGRESS) {
            return $this->report($attempt, 'none', $summary);
        }

        if ($summary['event_summary']['tab_switches'] >= $limit || $summary['risk_level'] === 'high') {
            $attempt->update([
                'blocked_at' => now(),
                'status' => AssessmentAttemptStatus::EXPIRED,
                'timed_out_at' => now(),
            ]);

            return $this->report($attempt->fresh(), 'blocked', $summary);
        }

        if ($summary['event_summary']['high_severity'] > 0 || $summary['risk_level'] === 'medium') {
            return $this->report($attempt, 'warned', $summary);
        }

        return $this->report($attempt, 'none', $summary);
    }

    /**
     * Flagged attempts for instructor review: blocked attempts, attempts
     * at/over the blur limit, or attempts with high-severity events.
     */
    public function flaggedForCourse(string $courseId, int $limit = 50)
    {
        $limit = max(1, $limit);
        $blurLimit = max(1, (int) config('assessments.attempt.tab_switch_limit', 3));
        $blurTypes = [IntegrityEventType::TAB_BLUR->value, IntegrityEventType::WINDOW_BLUR->value];
        $highSeverityTypes = [
            IntegrityEventType::DEVICE_CHANGED->value,
            IntegrityEventType::SESSION_CHANGED->value,
            IntegrityEventType::COPY_ATTEMPT->value,
            IntegrityEventType::PASTE_ATTEMPT->value,
            IntegrityEventType::DEV_TOOLS_OPENED->value,
            IntegrityEventType::FULLSCREEN_EXIT->value,
            IntegrityEventType::SCREENSHOT_ATTEMPT->value,
        ];

        $assessmentIds = \App\Domains\Assessments\Models\Assessment::where('course_id', $courseId)->pluck('id');

        return AssessmentAttempt::whereIn('assessment_id', $assessmentIds)
            ->where(function ($query) use ($blurTypes, $highSeverityTypes, $blurLimit) {
                $query->whereNotNull('blocked_at')
                    ->orWhere(function ($query) use ($blurTypes, $blurLimit) {
                        $query->whereRaw(
                            '(SELECT COUNT(*) FROM student_assessment_integrity_events WHERE attempt_id = assessment_attempts.id AND event_type IN (?, ?)) >= ?',
                            [$blurTypes[0], $blurTypes[1], $blurLimit]
                        );
                    })
                    ->orWhere(function ($query) use ($highSeverityTypes) {
                        $query->whereExists(function ($query) use ($highSeverityTypes) {
                            $query->selectRaw('1')
                                ->from('student_assessment_integrity_events')
                                ->whereColumn('attempt_id', 'assessment_attempts.id')
                                ->whereIn('event_type', $highSeverityTypes);
                        });
                    });
            })
            ->with(['assessment:id,title', 'user:id,first_name,last_name'])
            ->latest('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn ($attempt) => array_merge(
                ['attempt' => $attempt],
                $this->analysis->getIntegritySummary($attempt),
            ));
    }

    private function report(AssessmentAttempt $attempt, string $action, array $summary): array
    {
        return [
            'action' => $action,
            'blocked' => $attempt->blocked_at !== null,
            'tab_switch_count' => $attempt->tab_switch_count ?? 0,
            'risk_score' => $summary['risk_score'],
            'risk_level' => $summary['risk_level'],
        ];
    }
}
