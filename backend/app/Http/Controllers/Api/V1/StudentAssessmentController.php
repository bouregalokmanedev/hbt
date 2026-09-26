<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Actions\AbandonAssessmentAction;
use App\Domains\StudentAssessments\Actions\GetAssessmentDetailsAction;
use App\Domains\StudentAssessments\Actions\GetAssessmentHistoryAction;
use App\Domains\StudentAssessments\Actions\GetCompetencyResultsAction;
use App\Domains\StudentAssessments\Actions\GetRecommendationsAction;
use App\Domains\StudentAssessments\Actions\ListAvailableAssessmentsAction;
use App\Domains\StudentAssessments\Actions\ResumeAssessmentAction;
use App\Domains\StudentAssessments\Actions\ReviewAssessmentResultAction;
use App\Domains\StudentAssessments\Actions\SaveResponseAction;
use App\Domains\StudentAssessments\Actions\StartAssessmentAction;
use App\Domains\StudentAssessments\Actions\SubmitAssessmentAction;
use App\Domains\StudentAssessments\DTOs\SaveResponseData;
use App\Domains\StudentAssessments\Enums\IntegrityEventType;
use App\Domains\StudentAssessments\Requests\SaveResponseRequest;
use App\Domains\StudentAssessments\Requests\SubmitAssessmentRequest;
use App\Domains\StudentAssessments\Resources\AssessmentAttemptResource;
use App\Domains\StudentAssessments\Resources\AssessmentQuestionResource;
use App\Domains\StudentAssessments\Resources\AssessmentRecommendationResource;
use App\Domains\StudentAssessments\Resources\AssessmentResponseResource;
use App\Domains\StudentAssessments\Resources\AssessmentResultResource;
use App\Domains\StudentAssessments\Resources\CompetencyResultResource;
use App\Domains\StudentAssessments\Resources\StudentAssessmentResource;
use App\Domains\StudentAssessments\Services\IntegrityAnalysisService;
use App\Domains\StudentAssessments\Services\ResponseService;
use App\Domains\StudentAssessments\Services\ScenarioEvaluationService;
use App\Domains\StudentAssessments\Services\StudentDashboardService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentAssessmentController extends Controller
{
    public function __construct(
        private readonly ListAvailableAssessmentsAction $listAvailable,
        private readonly GetAssessmentDetailsAction $getDetails,
        private readonly StartAssessmentAction $startAction,
        private readonly ResumeAssessmentAction $resumeAction,
        private readonly SaveResponseAction $saveResponseAction,
        private readonly SubmitAssessmentAction $submitAction,
        private readonly AbandonAssessmentAction $abandonAction,
        private readonly ReviewAssessmentResultAction $reviewResultAction,
        private readonly GetAssessmentHistoryAction $historyAction,
        private readonly GetCompetencyResultsAction $competencyAction,
        private readonly GetRecommendationsAction $recommendationsAction,
        private readonly ResponseService $responseService,
        private readonly IntegrityAnalysisService $integrityService,
        private readonly ScenarioEvaluationService $scenarioService,
        private readonly StudentDashboardService $dashboardService,
    ) {}

    /**
     * GET /api/v1/student/dashboard — aggregated assessment dashboard (§31).
     */
    public function dashboard(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->dashboardService->dashboard($request->user()),
        ]);
    }

    /**
     * GET /api/v1/student/assessments — Available Assessments
     */
    public function index(Request $request): JsonResponse
    {
        $assessments = $this->listAvailable->execute($request->user());

        $data = $assessments->map(fn ($item) => (new StudentAssessmentResource($item))->toArray($request))->values();

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/v1/student/assessments/{assessment} — Assessment Information
     */
    public function show(Request $request, Assessment $assessment): JsonResponse
    {
        $details = $this->getDetails->execute($assessment, $request->user());

        return response()->json([
            'data' => [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'description' => $assessment->description,
                'course' => $assessment->course ? ['id' => $assessment->course->id, 'title' => $assessment->course->title] : null,
                'scope' => $assessment->scope(),
                'section' => $assessment->section ? ['id' => $assessment->section->id, 'title' => $assessment->section->title] : null,
                'lesson' => $assessment->lesson ? ['id' => $assessment->lesson->id, 'title' => $assessment->lesson->title] : null,
                'minimum_score' => $assessment->minimum_score,
                'max_attempts' => $assessment->max_attempts,
                'status' => $assessment->status->value,
                'questions_count' => $details['questions_count'],
                'eligibility' => $details['eligibility'],
            ],
        ]);
    }

    /**
     * POST /api/v1/student/assessments/{assessment}/attempts — START ATTEMPT
     * auth()->id() is the student_id — never from payload.
     */
    public function start(Request $request, Assessment $assessment): AssessmentAttemptResource
    {
        $attempt = $this->startAction->execute($assessment, $request->user());
        $attempt->load('assessment.questions.options', 'result');

        return new AssessmentAttemptResource($attempt);
    }

    /**
     * GET /api/v1/student/assessment-attempts/{attempt} — Resume (with autosaved responses)
     */
    public function resume(Request $request, AssessmentAttempt $attempt): AssessmentAttemptResource
    {
        $attempt = $this->resumeAction->execute($attempt, $request->user());
        $attempt->load('assessment.questions.options', 'result');

        return new AssessmentAttemptResource($attempt);
    }

    /**
     * PUT /api/v1/student/assessment-attempts/{attempt}/responses/{question} — Auto-save
     */
    public function saveResponse(SaveResponseRequest $request, AssessmentAttempt $attempt, string $question): JsonResponse
    {
        $answer = $request->input('answer');

        if ($answer === null) {
            $shaped = array_filter([
                'selected_option_ids' => $request->input('selected_option_ids'),
                'selected_option_id' => $request->input('selected_option_id'),
                'ordered_ids' => $request->input('ordered_ids'),
                'matches' => $request->input('matches'),
                'value' => $request->input('value', $request->input('text')),
            ], fn ($v) => $v !== null);

            $answer = $shaped === [] ? null : $shaped;
        }

        $data = new SaveResponseData(
            attemptId: $attempt->id,
            questionId: $question,
            answer: $answer,
            answerMetadata: $request->input('answer_metadata'),
            confidenceLevel: $request->input('confidence_level'),
            isFlagged: $request->input('is_flagged'),
            timeSpentSeconds: $request->input('time_spent_seconds'),
            responseType: $request->input('response_type'),
        );

        $response = $this->saveResponseAction->execute($data, $request->user());

        return response()->json(['data' => new AssessmentResponseResource($response)]);
    }

    /**
     * POST /api/v1/student/assessment-attempts/{attempt}/flag — Flag question
     */
    public function flag(Request $request, AssessmentAttempt $attempt, string $question): JsonResponse
    {
        $flagged = $request->input('is_flagged', true);
        $response = $this->responseService->flag($attempt->id, $question, $request->user(), (bool) $flagged);

        return response()->json(['data' => new AssessmentResponseResource($response)]);
    }

    /**
     * GET /api/v1/student/assessment-attempts/{attempt}/adaptive/next — Next CAT question
     *
     * The served question never carries answer keys or IRT parameters.
     */
    public function adaptiveNext(Request $request, AssessmentAttempt $attempt): JsonResponse
    {
        $service = app(\App\Domains\StudentAssessments\Services\AdaptiveAttemptService::class);
        $outcome = $service->nextQuestion($attempt, $request->user());

        return response()->json([
            'data' => [
                'complete' => $outcome['complete'],
                'question' => $outcome['question'] ? new AssessmentQuestionResource($outcome['question']) : null,
                'answered_count' => $outcome['answered_count'],
                'theta' => $outcome['theta'],
                'stop_reason' => $outcome['stop_reason'],
            ],
        ]);
    }

    /**
     * GET /api/v1/student/assessment-attempts/{attempt}/navigation — Question navigation
     */
    public function navigation(Request $request, AssessmentAttempt $attempt): JsonResponse
    {
        if ($attempt->user_id !== $request->user()->id) {
            abort(404);
        }

        return response()->json(['data' => $this->responseService->getNavigation($attempt)]);
    }

    /**
     * POST /api/v1/student/assessment-attempts/{attempt}/submit — Submit (evaluates)
     */
    public function submit(SubmitAssessmentRequest $request, AssessmentAttempt $attempt): JsonResponse
    {
        if ($attempt->user_id !== $request->user()->id) {
            abort(404);
        }

        // If answers provided in payload, map to scoring format; otherwise use autosaved responses
        $submittedAnswers = null;
        if ($request->has('answers')) {
            $submittedAnswers = $request->validated('answers');
        }

        $result = $this->submitAction->execute($attempt, $request->user(), $submittedAnswers);

        return response()->json([
            'data' => [
                'assessment_result' => new AssessmentResultResource($result['assessment_result']),
                'student_result' => new AssessmentResultResource($result['student_result']),
                'score' => $result['scoring']['score'],
                'passed' => $result['scoring']['passed'],
                'proficiency_level' => $result['student_result']->proficiency_level->value,
                'decision_score' => $result['decision_score'] ?? null,
                'evidence' => $result['scoring']['evidence'],
                'results' => $result['scoring']['results'],
            ],
        ], 201);
    }

    /**
     * GET /api/v1/student/assessment-attempts/{attempt}/scenarios — Linked scenarios + progress
     */
    public function scenarios(Request $request, AssessmentAttempt $attempt): JsonResponse
    {
        if ($attempt->user_id !== $request->user()->id) {
            abort(404);
        }

        $data = $this->scenarioService->linkedScenarios($attempt)->map(
            fn ($scenario) => $this->scenarioService->progress($attempt, $request->user(), $scenario)
        )->values();

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/v1/student/assessment-attempts/{attempt}/scenarios/{scenarioId} — Steps + current step
     *
     * Never exposes step configuration or scoring criteria.
     */
    public function scenarioDetail(Request $request, AssessmentAttempt $attempt, string $scenarioId): JsonResponse
    {
        $scenario = \App\Domains\DiagnosticScenarios\Models\DiagnosticScenario::findOrFail($scenarioId);

        return response()->json([
            'data' => $this->scenarioService->progress($attempt, $request->user(), $scenario),
        ]);
    }

    /**
     * POST /api/v1/student/assessment-attempts/{attempt}/scenarios/{scenarioId}/steps/{stepId}
     * Answer one scenario step. Body: {choice: {action?, component?, ...}}
     */
    public function answerScenarioStep(
        Request $request,
        AssessmentAttempt $attempt,
        string $scenarioId,
        string $stepId,
    ): JsonResponse {
        $validated = $request->validate([
            'choice' => ['required', 'array'],
        ]);

        $scenario = \App\Domains\DiagnosticScenarios\Models\DiagnosticScenario::findOrFail($scenarioId);
        $step = \App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep::findOrFail($stepId);

        $outcome = $this->scenarioService->answerStep(
            $attempt,
            $request->user(),
            $scenario,
            $step,
            $validated['choice'],
        );

        $next = $outcome['next_step'];

        return response()->json([
            'data' => [
                'points_earned' => $outcome['path']->points_earned,
                'scenario_complete' => $outcome['scenario_complete'],
                'next_step' => $next ? [
                    'id' => $next->id,
                    'position' => $next->position,
                    'title' => $next->title,
                    'description' => $next->description,
                    'action_type' => $next->action_type->value,
                    'evidence' => $next->evidence,
                    'is_required' => $next->is_required,
                    'is_terminal' => $next->is_terminal,
                ] : null,
            ],
        ]);
    }

    /**
     * POST /api/v1/student/assessment-attempts/{attempt}/abandon — ABANDONED
     */
    public function abandon(Request $request, AssessmentAttempt $attempt): JsonResponse
    {
        $attempt = $this->abandonAction->execute($attempt, $request->user());

        return response()->json(['data' => new AssessmentAttemptResource($attempt)]);
    }

    /**
     * GET /api/v1/student/assessment-attempts/{attempt}/result — Result (comprehensive)
     */
    public function result(Request $request, AssessmentAttempt $attempt): AssessmentResultResource
    {
        $result = $this->reviewResultAction->execute($attempt, $request->user());

        if ($result === null) {
            abort(404, 'Assessment result not found.');
        }

        return new AssessmentResultResource($result);
    }

    /**
     * GET /api/v1/student/assessment-attempts/{attempt}/competencies
     */
    public function competencies(Request $request, AssessmentAttempt $attempt): JsonResponse
    {
        $data = $this->competencyAction->execute($attempt, $request->user());

        return response()->json(['data' => CompetencyResultResource::collection($data)]);
    }

    /**
     * GET /api/v1/student/assessment-attempts/{attempt}/recommendations
     */
    public function recommendations(Request $request, AssessmentAttempt $attempt): JsonResponse
    {
        $data = $this->recommendationsAction->execute($attempt, $request->user());

        return response()->json(['data' => AssessmentRecommendationResource::collection($data)]);
    }

    /**
     * GET /api/v1/student/assessments/history
     */
    public function history(Request $request): JsonResponse
    {
        $history = $this->historyAction->execute($request->user(), (int) $request->input('per_page', 15));

        return response()->json($history->toArray());
    }

    /**
     * GET /api/v1/student/assessments/recommendations
     */
    public function globalRecommendations(Request $request): JsonResponse
    {
        $service = app(\App\Domains\StudentAssessments\Services\AssessmentRecommendationService::class);
        $data = $service->forStudent($request->user(), (int) $request->input('per_page', 15));

        return response()->json($data->toArray());
    }

    /**
     * POST /api/v1/student/assessment-attempts/{attempt}/integrity — Record integrity event
     */
    public function recordIntegrityEvent(Request $request, AssessmentAttempt $attempt): JsonResponse
    {
        if ($attempt->user_id !== $request->user()->id) {
            abort(404);
        }

        $eventType = $request->input('event_type');
        if (! IntegrityEventType::tryFrom($eventType)) {
            abort(422, 'Invalid event type');
        }

        $this->integrityService->recordEvent($attempt, IntegrityEventType::from($eventType), $request->input('metadata', []));

        $enforcement = app(\App\Domains\StudentAssessments\Services\IntegrityEnforcementService::class)
            ->enforce($attempt, $request->user());

        return response()->json(['message' => 'Event recorded', 'enforcement' => $enforcement]);
    }

    /**
     * GET /api/v1/student/assessment-attempts/{attempt}/integrity — Get integrity summary
     */
    public function integritySummary(Request $request, AssessmentAttempt $attempt): JsonResponse
    {
        if ($attempt->user_id !== $request->user()->id) {
            abort(404);
        }

        return response()->json(['data' => $this->integrityService->getIntegritySummary($attempt)]);
    }
}
