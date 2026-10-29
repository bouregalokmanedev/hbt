<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Assessments\Actions\SaveAssessmentAttemptAnswersAction;
use App\Domains\Assessments\Actions\StartAssessmentAttemptAction;
use App\Domains\Assessments\Actions\SubmitAssessmentAttemptAction;
use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Enums\IntegrityEventType;
use App\Domains\StudentAssessments\Exceptions\AssessmentAccessDeniedException;
use App\Domains\StudentAssessments\Services\IntegrityAnalysisService;
use App\Domains\StudentAssessments\Services\IntegrityEnforcementService;
use App\Domains\StudentAssessments\Specifications\AssessmentAccessibleSpecification;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Assessments\StartAssessmentAttemptRequest;
use App\Http\Requests\Api\V1\Assessments\SubmitAssessmentAttemptRequest;
use App\Http\Resources\Api\V1\Assessments\AssessmentAttemptResource;
use App\Http\Resources\Api\V1\Assessments\AssessmentResultResource;
use Illuminate\Http\JsonResponse;
use App\Domains\Assessments\Services\AssessmentScoringService;
use Illuminate\Http\Request;

final class AssessmentAttemptController extends Controller
{
    public function __construct(
        private readonly StartAssessmentAttemptAction $startAssessmentAttemptAction,
        private readonly SubmitAssessmentAttemptAction $submitAssessmentAttemptAction,
        private readonly SaveAssessmentAttemptAnswersAction $saveAssessmentAttemptAnswersAction,
        private readonly AssessmentScoringService $assessmentScoringService,
        private readonly AssessmentAccessibleSpecification $accessibleSpec,
        private readonly IntegrityAnalysisService $integrityService,
        private readonly IntegrityEnforcementService $enforcementService,
    ) {
    }

    /**
     * List the authenticated user's assessment attempts.
     */
    public function index(
        Request $request,
        Assessment $assessment,
    ): JsonResponse {
       $attempts = AssessmentAttempt::query()
    ->where('assessment_id', $assessment->id)
    ->where('user_id', $request->user()->id)
    ->latest('attempt_number')
    ->get();

        return response()->json([
            'data' => AssessmentAttemptResource::collection($attempts),
        ]);
    }

    /**
     * Start an assessment attempt.
     */
    public function store(
        StartAssessmentAttemptRequest $request,
        Assessment $assessment,
    ): AssessmentAttemptResource {
        $user = $request->user();

        if (! $this->accessibleSpec->isSatisfiedBy($assessment, $user)) {
            throw new AssessmentAccessDeniedException(
                $this->accessibleSpec->reason($assessment, $user)
                    ?? 'Access to this assessment is denied.'
            );
        }

        $attempt = $this->startAssessmentAttemptAction->execute(
            assessment: $assessment,
            user: $user,
        );

        $attempt->load('result', 'assessment.questions.options', 'answers.selectedOptions');

        return new AssessmentAttemptResource($attempt);
    }

    /**
     * Show a specific assessment attempt.
     */
    public function show(
        Request $request,
        Assessment $assessment,
        AssessmentAttempt $attempt,
    ): AssessmentAttemptResource {
        $this->ensureAttemptBelongsToUser(
            $request,
            $assessment,
            $attempt,
        );

        $attempt->load('result', 'assessment.questions.options', 'answers.selectedOptions');

        return new AssessmentAttemptResource($attempt);
    }

    /**
     * Autosave one question's selection while the attempt is running.
     */
    public function saveAnswers(
        Request $request,
        Assessment $assessment,
        AssessmentAttempt $attempt,
        string $question,
    ): JsonResponse {
        $this->ensureAttemptBelongsToUser(
            $request,
            $assessment,
            $attempt,
        );

        $data = $request->validate([
            'option_ids' => ['sometimes', 'array'],
            'option_ids.*' => ['uuid'],
            'selected_option_ids' => ['sometimes', 'array'],
            'selected_option_ids.*' => ['uuid'],
            'selected_option_id' => ['sometimes', 'uuid'],
            'value' => ['sometimes', 'nullable'],
            'text' => ['sometimes', 'nullable', 'string'],
            'answer' => ['sometimes', 'nullable'],
            'ordered_ids' => ['sometimes', 'array'],
            'ordered_ids.*' => ['uuid'],
            'matches' => ['sometimes', 'array'],
            'confidence_level' => ['sometimes', 'nullable', 'string', 'max:32'],
        ]);

        $hasAnswer = collect([
            'option_ids',
            'selected_option_ids',
            'selected_option_id',
            'value',
            'text',
            'answer',
            'ordered_ids',
            'matches',
        ])->contains(fn (string $key) => $request->exists($key));

        if (! $hasAnswer) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'answer' => 'An answer payload is required.',
            ]);
        }

        $answer = $this->saveAssessmentAttemptAnswersAction->execute(
            attempt: $attempt,
            questionId: $question,
            payload: $data,
        );

        return response()->json([
            'data' => [
                'saved' => true,
                'question_id' => $question,
                'answer' => $answer->answer,
                'selected_option_ids' => $answer->selectedOptions
                    ->pluck('option_id')
                    ->values()
                    ->all(),
                'confidence_level' => $answer->confidence_level,
            ],
        ]);
    }

    /**
     * Submit an assessment attempt.
     */
    public function submit(
    SubmitAssessmentAttemptRequest $request,
    Assessment $assessment,
    AssessmentAttempt $attempt,
): JsonResponse {
    $this->ensureAttemptBelongsToUser(
        $request,
        $assessment,
        $attempt,
    );

    if ($attempt->expires_at?->isPast()) {
        $attempt->update(['status' => AssessmentAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
        abort(422, 'Time expired. You can retake this assessment twelve hours after the timeout.');
    }

    $submittedAnswers = $request->validated('answers');

    // Optional questions may be skipped, but a required question without an
    // answer would silently score zero. Refuse the submission instead.
    $assessment->loadMissing('questions.options');
    $answersByQuestion = collect($submittedAnswers)
        ->keyBy(fn (array $answer) => (string) ($answer['question_id'] ?? ''));

    $unanswered = [];

    foreach ($assessment->questions as $question) {
        if (! (bool) ($question->required ?? true)) {
            continue;
        }

        $answer = $answersByQuestion->get((string) $question->id);

        if ($answer === null || ! $this->answerHasContent($question, $answer)) {
            $unanswered[] = (string) $question->id;
        }
    }

    if ($unanswered !== []) {
        throw \Illuminate\Validation\ValidationException::withMessages([
            'answers' => 'Answer every required question before submitting.',
        ]);
    }

    $scoring = $this->assessmentScoringService->calculate(
        attempt: $attempt,
        user: $request->user(),
        submittedAnswers: $submittedAnswers,
    );

    $result = $this->submitAssessmentAttemptAction->execute(
        attempt: $attempt,
        user: $request->user(),
        scoring: $scoring,
    );

    return response()->json([
        'data' => [
            'assessment_id' => $assessment->id,
            'assessment_attempt_id' => $attempt->id,
            'score' => $result->score,
            'passed' => $result->passed,
            'attempt_number' => $result->attempt_number,
            'completed_at' => $result->completed_at,
            'evidence' => $result->evidence,
            'results' => $result->results,
        ],
    ], 201);
}

    public function expire(Request $request, Assessment $assessment, AssessmentAttempt $attempt): JsonResponse
    {
        $this->ensureAttemptBelongsToUser($request, $assessment, $attempt);
        if ($attempt->status === AssessmentAttemptStatus::IN_PROGRESS) {
            $attempt->update(['status' => AssessmentAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
        }
        return response()->json(['message' => 'Time expired. You can retake this assessment in twelve hours.']);
    }

    public function tabSwitch(Request $request, Assessment $assessment, AssessmentAttempt $attempt): JsonResponse
    {
        $this->ensureAttemptBelongsToUser($request, $assessment, $attempt);

        if ($attempt->status === AssessmentAttemptStatus::IN_PROGRESS) {
            $this->integrityService->recordEvent($attempt, IntegrityEventType::TAB_BLUR, [
                'source' => 'legacy_tab_switch',
            ]);
            $this->enforcementService->enforce($attempt, $request->user());
        }

        $fresh = $attempt->fresh();

        return response()->json([
            'data' => [
                'tab_switch_count' => $fresh->tab_switch_count ?? 0,
                'blocked' => $fresh->blocked_at !== null,
            ],
        ]);
    }

    /**
     * Show the final assessment result.
     */
    public function result(
        Request $request,
        Assessment $assessment,
        AssessmentAttempt $attempt,
    ): AssessmentResultResource {
        $this->ensureAttemptBelongsToUser(
            $request,
            $assessment,
            $attempt,
        );

        if (
            $attempt->status === AssessmentAttemptStatus::IN_PROGRESS
        ) {
            abort(
                409,
                'Assessment attempt has not been submitted yet.'
            );
        }

       $attempt->load('result');

if ($attempt->result === null) {
    abort(
        404,
        'Assessment result not found.'
    );
}

return new AssessmentResultResource($attempt->result);
    }

    /**
     * A required question needs an answer with actual content, not merely a
     * key in the payload. Empty choices and blank text are treated as
     * unanswered.
     */
    private function answerHasContent(mixed $question, array $answer): bool
    {
        $type = $question->type?->value ?? (string) $question->type;

        return match ($type) {
            'single_choice', 'multiple_choice', 'true_false' => count(
                $answer['option_ids']
                    ?? $answer['selected_option_ids']
                    ?? (isset($answer['selected_option_id']) ? [$answer['selected_option_id']] : [])
            ) > 0,
            'ordering' => count($answer['ordered_ids'] ?? $answer['option_ids'] ?? [])
                >= $question->options->count(),
            'matching' => count($answer['matches'] ?? [])
                >= count(array_keys((array) (($question->answer_key ?? [])['pairs'] ?? []))),
            default => trim((string) ($answer['value'] ?? $answer['text'] ?? $answer['answer'] ?? '')) !== '',
        };
    }

    /**
     * Ensure the attempt belongs to both the assessment
     * and the authenticated user.
     */
    private function ensureAttemptBelongsToUser(
        Request $request,
        Assessment $assessment,
        AssessmentAttempt $attempt,
    ): void {
        if (
            $attempt->assessment_id !== $assessment->id ||
            $attempt->user_id !== $request->user()->id
        ) {
            abort(404);
        }
    }
}
