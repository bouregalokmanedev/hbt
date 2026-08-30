<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Assessments\Actions\StartAssessmentAttemptAction;
use App\Domains\Assessments\Actions\SubmitAssessmentAttemptAction;
use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
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
    private readonly AssessmentScoringService $assessmentScoringService,
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
        $attempt = $this->startAssessmentAttemptAction->execute(
            assessment: $assessment,
            user: $request->user(),
        );

        $attempt->load('result', 'assessment.questions.options');

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

        $attempt->load('result', 'assessment.questions.options');

        return new AssessmentAttemptResource($attempt);
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

    $scoring = $this->assessmentScoringService->calculate(
        attempt: $attempt,
        user: $request->user(),
        submittedAnswers: $request->validated('answers'),
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
            $count = $attempt->tab_switch_count + 1;
            $attempt->update(['tab_switch_count' => $count, 'blocked_at' => $count >= 3 ? now() : null, 'status' => $count >= 3 ? AssessmentAttemptStatus::EXPIRED : AssessmentAttemptStatus::IN_PROGRESS, 'timed_out_at' => $count >= 3 ? now() : null]);
        }
        return response()->json(['data' => ['tab_switch_count' => $attempt->fresh()->tab_switch_count, 'blocked' => $attempt->fresh()->blocked_at !== null]]);
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
