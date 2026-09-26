<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Services\AssessmentScoringService;
use App\Domains\Assessments\Services\QuestionGradingService;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Models\User;
use Illuminate\Support\Collection;
use LogicException;

final class AdaptiveAttemptService
{
    public function __construct(
        private readonly AdaptiveAssessmentService $adaptive,
        private readonly QuestionGradingService $grading,
        private readonly AssessmentScoringService $scoring,
        private readonly AssessmentScoringOrchestrator $orchestrator,
    ) {}

    public function isAdaptive(Assessment $assessment): bool
    {
        return $assessment->isAdaptive();
    }

    /**
     * Calibrated question pool for the assessment (CAT candidates).
     */
    public function pool(Assessment $assessment): Collection
    {
        return $assessment->questions()
            ->where('is_calibrated', true)
            ->with('options')
            ->get();
    }

    /**
     * Current ability estimate from graded autosaved responses.
     * Only calibrated questions inform θ; uncalibrated answers are
     * ignored for the estimate (they still score normally at submit).
     */
    public function currentTheta(AssessmentAttempt $attempt): float
    {
        $graded = $this->gradedAnswers($attempt);

        if ($graded === []) {
            return 0.0;
        }

        return $this->adaptive->estimateAbility(
            collect($graded)->mapWithKeys(fn ($g) => [$g['question_id'] => ['is_correct' => $g['is_correct']]])->all(),
            collect($graded)->mapWithKeys(fn ($g) => [$g['question_id'] => $g['params']])->all(),
        );
    }

    /**
     * Next CAT question for an IN_PROGRESS attempt, or a stop signal.
     *
     * @return array{complete: bool, question: ?QuizQuestion, answered_count: int, theta: float, stop_reason: ?string}
     */
    public function nextQuestion(AssessmentAttempt $attempt, User $user): array
    {
        $this->guard($attempt, $user);
        $attempt->loadMissing('assessment');
        $assessment = $attempt->assessment;

        if (! $this->isAdaptive($assessment)) {
            throw new LogicException('This assessment is not adaptive.');
        }

        $config = $assessment->adaptiveConfig();
        $pool = $this->pool($assessment);

        $answeredIds = $this->answeredIds($attempt);
        $unanswered = $pool->whereNotIn('id', $answeredIds);

        if ($unanswered->isEmpty()) {
            return $this->stop($attempt, 'bank_exhausted');
        }

        $theta = $this->currentTheta($attempt);

        if ($this->adaptive->shouldStopCat(
            $theta,
            $this->thetaResponseMap($attempt),
            $this->thetaParamMap($pool),
            (int) $config['min_questions'],
            min((int) $config['max_questions'], $pool->count()),
            (float) $config['target_se'],
        )) {
            $reason = count($answeredIds) >= min((int) $config['max_questions'], $pool->count())
                ? 'max_questions'
                : 'precision_reached';

            return $this->stop($attempt, $reason, $theta);
        }

        $next = $this->adaptive->selectNextQuestion($theta, $pool, $answeredIds);

        if ($next === null) {
            return $this->stop($attempt, 'bank_exhausted', $theta);
        }

        return [
            'complete' => false,
            'question' => $next,
            'answered_count' => count($answeredIds),
            'theta' => round($theta, 3),
            'stop_reason' => null,
        ];
    }

    /**
     * Finalize an adaptive attempt: grade answered questions, estimate
     * final ability, and score as θ percentage. Returns the standard
     * scoring shape so the shared submit pipeline applies unchanged.
     */
    public function finalize(AssessmentAttempt $attempt, User $user, ?array $submittedAnswers = null): array
    {
        $attempt->loadMissing('assessment');

        $submittedAnswers ??= $this->orchestrator->buildSubmittedAnswers($attempt);

        $answeredIds = collect($submittedAnswers)->pluck('question_id')->map(fn ($id) => (string) $id)->all();
        $poolIds = $this->pool($attempt->assessment)->pluck('id')->map(fn ($id) => (string) $id)->all();
        $calibratedAnswered = array_values(array_intersect($answeredIds, $poolIds));

        $scoring = $this->scoring->calculate($attempt, $user, $submittedAnswers);

        if ($calibratedAnswered === []) {
            return $scoring;
        }

        // CAT stops early by design: unanswered bank items must not
        // count as zero. Points earned already cover answered questions
        // only; restrict the total the same way for a coherent payload.
        $pivotPoints = $attempt->assessment->questions()->get()
            ->mapWithKeys(fn ($q) => [(string) $q->id => (int) $q->pivot->points]);
        $scoring['total_points'] = collect($answeredIds)
            ->map(fn ($id) => $pivotPoints->get($id, 0))
            ->sum();

        $theta = $this->thetaFromResults($scoring['results'] ?? [], $attempt);
        $scoring['score'] = round($this->adaptive->thetaToPercentage($theta), 2);
        $scoring['passed'] = $scoring['score'] >= (float) $attempt->assessment->minimum_score;
        $scoring['theta'] = round($theta, 3);
        $scoring['adaptive'] = true;

        return $scoring;
    }

    /**
     * Grade autosaved answers for θ estimation.
     *
     * @return array<int, array{question_id: string, is_correct: bool, params: array}>
     */
    private function gradedAnswers(AssessmentAttempt $attempt): array
    {
        $responses = \App\Domains\StudentAssessments\Models\StudentAssessmentResponse::where('attempt_id', $attempt->id)->get();

        if ($responses->isEmpty()) {
            return [];
        }

        $attempt->loadMissing('assessment');
        $questions = $attempt->assessment->questions()->with('options')->get()->keyBy(fn ($q) => (string) $q->id);

        $graded = [];
        foreach ($responses as $response) {
            $qid = (string) $response->question_id;
            $question = $questions->get($qid);

            if ($question === null || ! $question->is_calibrated) {
                continue;
            }

            $answer = $response->answer ?? [];
            if (! is_array($answer)) {
                continue;
            }

            try {
                $grade = $this->grading->grade($question, $answer, 1);
            } catch (LogicException) {
                continue;
            }

            $graded[] = [
                'question_id' => $qid,
                'is_correct' => $grade['is_correct'],
                'params' => [
                    'irt_a' => $question->irt_a,
                    'irt_b' => $question->irt_b,
                    'irt_c' => $question->irt_c ?? 0,
                ],
            ];
        }

        return $graded;
    }

    private function answeredIds(AssessmentAttempt $attempt): array
    {
        return \App\Domains\StudentAssessments\Models\StudentAssessmentResponse::where('attempt_id', $attempt->id)
            ->pluck('question_id')
            ->map(fn ($id) => (string) $id)
            ->all();
    }

    private function thetaResponseMap(AssessmentAttempt $attempt): array
    {
        return collect($this->gradedAnswers($attempt))
            ->mapWithKeys(fn ($g) => [$g['question_id'] => ['is_correct' => $g['is_correct']]])
            ->all();
    }

    private function thetaParamMap(Collection $pool): array
    {
        return $pool->mapWithKeys(fn ($q) => [(string) $q->id => [
            'irt_a' => $q->irt_a,
            'irt_b' => $q->irt_b,
            'irt_c' => $q->irt_c ?? 0,
        ]])->all();
    }

    private function thetaFromResults(array $results, AssessmentAttempt $attempt): float
    {
        $attempt->loadMissing('assessment');
        $params = $this->thetaParamMap($this->pool($attempt->assessment));

        $responses = [];
        foreach ($results as $row) {
            $qid = (string) ($row['question_id'] ?? '');
            if (isset($params[$qid])) {
                $responses[$qid] = ['is_correct' => $row['is_correct'] ?? false];
            }
        }

        if ($responses === []) {
            return 0.0;
        }

        return $this->adaptive->estimateAbility($responses, $params);
    }

    private function stop(AssessmentAttempt $attempt, string $reason, ?float $theta = null): array
    {
        return [
            'complete' => true,
            'question' => null,
            'answered_count' => count($this->answeredIds($attempt)),
            'theta' => round($theta ?? $this->currentTheta($attempt), 3),
            'stop_reason' => $reason,
        ];
    }

    private function guard(AssessmentAttempt $attempt, User $user): void
    {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        if ($attempt->status !== AssessmentAttemptStatus::IN_PROGRESS) {
            abort(409, 'Attempt is not in progress.');
        }

        if ($attempt->expires_at?->isPast()) {
            $attempt->update(['status' => AssessmentAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
            abort(422, 'Time expired. You can retake this assessment twelve hours after the timeout.');
        }
    }
}
