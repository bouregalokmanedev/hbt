<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Enums\IntegrityEventType;
use App\Domains\StudentAssessments\Models\StudentAssessmentIntegrityEvent;
use Illuminate\Support\Collection;

final class IntegrityAnalysisService
{
    /**
     * Record an integrity event.
     */
    public function recordEvent(
        AssessmentAttempt $attempt,
        IntegrityEventType $eventType,
        array $metadata = []
    ): StudentAssessmentIntegrityEvent {
        return StudentAssessmentIntegrityEvent::create([
            'attempt_id' => $attempt->id,
            'event_type' => $eventType->value,
            'occurred_at' => now(),
            'metadata' => $metadata,
        ]);
    }

    /**
     * Analyze attempt for suspicious patterns.
     * Returns array with risk_score (0-100) and flagged issues.
     */
    public function analyzeAttempt(AssessmentAttempt $attempt): array
    {
        $events = StudentAssessmentIntegrityEvent::where('attempt_id', $attempt->id)
            ->orderBy('occurred_at')
            ->get();

        $issues = [];
        $riskScore = 0;

        // 1. Tab/window blur count
        $blurCount = $events->whereIn('event_type', [
            IntegrityEventType::TAB_BLUR->value,
            IntegrityEventType::WINDOW_BLUR->value,
        ])->count();
        if ($blurCount > 5) {
            $issues[] = "Excessive tab/window switching ($blurCount times)";
            $riskScore += min($blurCount * 5, 30);
        }

        // 2. High-severity events
        $highSeverity = $events->filter(fn ($e) => 
            in_array($e->event_type, [
                IntegrityEventType::DEVICE_CHANGED->value,
                IntegrityEventType::SESSION_CHANGED->value,
                IntegrityEventType::COPY_ATTEMPT->value,
                IntegrityEventType::PASTE_ATTEMPT->value,
                IntegrityEventType::DEV_TOOLS_OPENED->value,
                IntegrityEventType::FULLSCREEN_EXIT->value,
                IntegrityEventType::SCREENSHOT_ATTEMPT->value,
            ])
        );
        if ($highSeverity->isNotEmpty()) {
            $issues[] = 'High-severity integrity events: '.$highSeverity->pluck('event_type')->implode(', ');
            $riskScore += $highSeverity->count() * 15;
        }

        // 3. Unusual timing patterns (answers too fast)
        $responseEvents = $events->where('event_type', IntegrityEventType::QUESTION_ANSWERED->value);
        if ($responseEvents->count() > 1) {
            $timestamps = $responseEvents->pluck('occurred_at')->sort()->values();
            $intervals = [];
            for ($i = 1; $i < $timestamps->count(); $i++) {
                // Carbon 3 returns signed diffs by default — use absolute values.
                $intervals[] = abs($timestamps[$i]->diffInSeconds($timestamps[$i - 1]));
            }
            $avgInterval = array_sum($intervals) / count($intervals);
            if ($avgInterval < 10) { // Less than 10 seconds per question average
                $issues[] = "Unusually fast responses (avg {$avgInterval}s/question)";
                $riskScore += 20;
            }
        }

        // 4. Multiple device/session changes
        $deviceChanges = $events->where('event_type', IntegrityEventType::DEVICE_CHANGED->value)->count();
        $sessionChanges = $events->where('event_type', IntegrityEventType::SESSION_CHANGED->value)->count();
        if ($deviceChanges > 1 || $sessionChanges > 1) {
            $issues[] = "Multiple device/session changes (device: $deviceChanges, session: $sessionChanges)";
            $riskScore += ($deviceChanges + $sessionChanges) * 10;
        }

        // 4. Time warnings ignored
        $timeWarnings = $events->where('event_type', IntegrityEventType::TIME_WARNING->value)->count();
        if ($timeWarnings > 2) {
            $issues[] = "Multiple time warnings ignored ($timeWarnings)";
            $riskScore += 5;
        }

        // 5. Copy/paste attempts
        $copyPaste = $events->whereIn('event_type', [
            IntegrityEventType::COPY_ATTEMPT->value,
            IntegrityEventType::PASTE_ATTEMPT->value,
        ])->count();
        if ($copyPaste > 0) {
            $issues[] = "Copy/paste attempts detected ($copyPaste)";
            $riskScore += $copyPaste * 10;
        }

        // Cap at 100
        $riskScore = min($riskScore, 100);

        return [
            'risk_score' => $riskScore,
            'risk_level' => $this->riskLevel($riskScore),
            'issues' => $issues,
            'event_counts' => $events->groupBy('event_type')->map->count()->toArray(),
            'total_events' => $events->count(),
            'high_severity_count' => $highSeverity->count(),
            'blur_count' => $blurCount,
        ];
    }

    /**
     * Get integrity summary for an attempt (for UI display).
     */
    public function getIntegritySummary(AssessmentAttempt $attempt): array
    {
        $analysis = $this->analyzeAttempt($attempt);
        
        return [
            'attempt_id' => $attempt->id,
            'risk_score' => $analysis['risk_score'],
            'risk_level' => $analysis['risk_level'],
            'flagged' => $analysis['risk_score'] >= 50,
            'issues' => $analysis['issues'],
            'event_summary' => [
                'total' => $analysis['total_events'],
                'high_severity' => $analysis['high_severity_count'],
                'tab_switches' => $analysis['blur_count'],
            ],
        ];
    }

    private function riskLevel(int $score): string
    {
        return match (true) {
            $score >= 70 => 'high',
            $score >= 40 => 'medium',
            $score >= 20 => 'low',
            default => 'clean',
        };
    }

    /**
     * Get all attempts with high risk scores for review.
     */
    public function getFlaggedAttempts(int $threshold = 50, int $perPage = 20)
    {
        // This would need a more complex query - for now return empty
        // In production, you'd aggregate risk scores periodically
        return collect();
    }
}