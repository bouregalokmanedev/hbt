<?php

namespace App\Domains\Assessments\Actions;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Events\AssessmentPassed;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Domains\Certificates\Actions\IssueCertificateAction;
use App\Models\User;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Progression\Services\StudentProgressionService;
use Illuminate\Support\Facades\DB;
use LogicException;

final class SubmitAssessmentAttemptAction
{
    /**
     * Finalize an assessment attempt using
     * an already calculated score.
     *
     * Supports both:
     * - a simple numeric score
     * - a scoring array returned by AssessmentScoringService
     */
    public function execute(
        AssessmentAttempt $attempt,
        User $user,
        float|int|array $scoring,
        array $evidence = [],
        array $results = [],
    ): AssessmentResult {
        $score = is_array($scoring)
            ? (float) ($scoring['score'] ?? 0)
            : (float) $scoring;

        if (is_array($scoring)) {
            $evidence = $scoring['evidence'] ?? $evidence;
            $results = $scoring['results'] ?? $results;
        }

        return DB::transaction(function () use (
            $attempt,
            $user,
            $score,
            $evidence,
            $results,
        ): AssessmentResult {
            $attempt->loadMissing('assessment');

            if ($attempt->user_id !== $user->id) {
                throw new LogicException(
                    'User cannot submit another user\'s assessment attempt.'
                );
            }

            if (
                $attempt->status !== AssessmentAttemptStatus::IN_PROGRESS
            ) {
                throw new LogicException(
                    'This assessment attempt has already been submitted.'
                );
            }

            if ($attempt->result()->exists()) {
                throw new LogicException(
                    'This assessment attempt already has a result.'
                );
            }

            $completedAt = now();

            $passed = $score >= (float) $attempt->assessment->minimum_score;

            $attempt->update([
                'status' => $passed
                    ? AssessmentAttemptStatus::PASSED
                    : AssessmentAttemptStatus::FAILED,

                'score' => $score,
                'passed' => $passed,
                'submitted_at' => $completedAt,
                'completed_at' => $completedAt,
            ]);

            $result = AssessmentResult::create([
                'assessment_id' => $attempt->assessment_id,
                'assessment_attempt_id' => $attempt->id,
                'user_id' => $attempt->user_id,
                'score' => $score,
                'passed' => $passed,
                'attempt_number' => $attempt->attempt_number,
                'completed_at' => $completedAt,
                'evidence' => $evidence,
                'results' => $results,
            ]);

            if ($passed) {
                AssessmentPassed::dispatch($result);
                app(StudentProgressionService::class)->award($user, 'assessment_passed', 45, 65, "assessment-attempt:{$attempt->id}", ['label' => 'Assessment passed']);
            }

            if ($result->passed) {
    app(IssueCertificateAction::class)
        ->execute($result);
}

            app(StudentNotificationService::class)->send(
                $user,
                $passed ? 'assessment_passed' : 'assessment_submitted',
                $passed ? 'Assessment passed' : 'Assessment submitted',
                $passed ? 'Great work—you passed your final assessment and your certificate is being prepared.' : 'Your assessment has been submitted. Review the result and keep building your skills.',
                $passed ? '/certificates' : '/assessments',
                "assessment-result:{$result->id}",
            );

            return $result;
        });
    }
}
