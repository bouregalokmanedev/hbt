<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\DiagnosticScenarios\Actions\AnswerDiagnosticScenarioStepAction;
use App\Domains\DiagnosticScenarios\Actions\StartDiagnosticScenarioAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\SubmitDiagnosticScenarioAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\UseDiagnosticHintAction;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioScoringCriterion;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\DiagnosticScenarios\Queries\AvailableDiagnosticQuery;
use App\Domains\DiagnosticScenarios\Queries\DiagnosticHistoryQuery;
use App\Domains\DiagnosticScenarios\Requests\DiagnosticHistoryRequest;
use App\Domains\DiagnosticScenarios\Requests\StartDiagnosticAttemptRequest;
use App\Domains\DiagnosticScenarios\Requests\SubmitDiagnosticStepRequest;
use App\Domains\DiagnosticScenarios\Requests\UseDiagnosticHintRequest;
use App\Domains\DiagnosticScenarios\Resources\DiagnosticAttemptResource;
use App\Domains\DiagnosticScenarios\Resources\DiagnosticHintResource;
use App\Domains\DiagnosticScenarios\Resources\DiagnosticResultResource;
use App\Domains\DiagnosticScenarios\Services\DiagnosticAccessService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class StudentScenarioController extends Controller
{
    public function __construct(
        private readonly StartDiagnosticScenarioAttemptAction $startAction,
        private readonly AnswerDiagnosticScenarioStepAction $answerAction,
        private readonly SubmitDiagnosticScenarioAttemptAction $submitAction,
        private readonly UseDiagnosticHintAction $hintAction,
        private readonly DiagnosticAccessService $access,
        private readonly AvailableDiagnosticQuery $availableQuery,
        private readonly DiagnosticHistoryQuery $historyQuery,
    ) {}

    /**
     * GET /api/v1/student/scenarios — Diagnostic Hub (available / in-progress / completed).
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course' => ['nullable', 'uuid', 'exists:courses,id'],
        ]);

        $data = $this->availableQuery->forStudent($request->user(), $validated['course'] ?? null);

        return response()->json(['data' => $data]);
    }

    /**
     * GET /api/v1/student/scenarios/{scenario} — detail + sanitized steps + my progress.
     */
    public function show(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        if ($scenario->status !== DiagnosticScenarioStatus::PUBLISHED) {
            abort(404);
        }

        $user = $request->user();
        $scenario->load([
            'course:id,title',
            'dataPack.vehicleVariant.model.make',
            'steps' => fn ($q) => $q->orderBy('position'),
        ]);

        $attempt = $scenario->attempts()
            ->where('user_id', $user->id)
            ->where('status', DiagnosticScenarioAttemptStatus::IN_PROGRESS)
            ->first();

        $answeredIds = $attempt
            ? collect($attempt->evidence['steps'] ?? [])->keys()->map(fn ($id) => (string) $id)
            : collect();

        $current = $scenario->steps->first(fn ($s) => ! $answeredIds->contains((string) $s->id));

        return response()->json([
            'data' => [
                'id' => $scenario->id,
                'title' => $scenario->title,
                'description' => $scenario->description,
                'passing_score' => $scenario->passing_score,
                'time_limit' => $scenario->time_limit,
                'max_hints' => $scenario->hintBudget(),
                'customer_complaint' => $scenario->customer_complaint,
                'fault_codes' => $scenario->fault_codes ?? [],
                'system_tag' => $scenario->system_tag,
                'vehicle' => $this->presentVehicle($scenario),
                'in_progress_attempt_id' => $attempt?->id,
                'current_step_id' => $current?->id,
                'steps' => $scenario->steps->map(fn ($s) => $this->sanitizeStep($s, $answeredIds))->values()->all(),
            ],
        ]);
    }

    /**
     * POST /api/v1/student/scenarios/{scenario}/attempts — start (idempotent).
     */
    public function start(StartDiagnosticAttemptRequest $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->access->assertCanStart(
            $scenario,
            $request->user(),
            $request->input('course_id'),
        );

        $attempt = $this->startAction->execute($scenario, $request->user());

        return response()->json(['data' => $this->presentAttempt($attempt)], 201);
    }

    /**
     * GET /api/v1/student/scenario-attempts/{attempt} — resume with saved answers.
     */
    public function resume(Request $request, DiagnosticScenarioAttempt $attempt): JsonResponse
    {
        $this->ensureMine($request, $attempt);

        if ($attempt->status !== DiagnosticScenarioAttemptStatus::IN_PROGRESS) {
            abort(409, 'Scenario attempt is not in progress.');
        }

        return response()->json(['data' => $this->presentAttempt($attempt->fresh()->load('scenario'))]);
    }

    /**
     * PUT /api/v1/student/scenario-attempts/{attempt}/steps/{step} — answer (autosave).
     * Accepts `payload` (canonical) or `choice` (legacy) plus optional `tool`.
     */
    public function answerStep(SubmitDiagnosticStepRequest $request, DiagnosticScenarioAttempt $attempt, string $step): JsonResponse
    {
        $stepModel = DiagnosticScenarioStep::findOrFail($step);

        // Backend remains authoritative; tool context recorded for audit/scoring.
        $outcome = $this->answerAction->execute(
            $attempt,
            $request->user(),
            $stepModel,
            $request->actionPayload(),
            $request->actionTool(),
        );

        $next = $outcome['next_step'];

        return response()->json([
            'data' => [
                'points_earned' => $outcome['points_earned'],
                'scenario_complete' => $outcome['scenario_complete'],
                'next_step' => $next ? $this->sanitizeStep($next, collect()) : null,
            ],
        ]);
    }

    /**
     * POST /api/v1/student/scenario-attempts/{attempt}/submit.
     */
    public function submit(Request $request, DiagnosticScenarioAttempt $attempt): JsonResponse
    {
        $attempt = $this->submitAction->execute($attempt, $request->user());
        $attempt->load('result');

        return response()->json([
            'data' => (new DiagnosticAttemptResource($attempt))->toArray($request),
        ], 201);
    }

    /**
     * POST /api/v1/student/scenario-attempts/{attempt}/hints — progressive hint with penalty.
     */
    public function useHint(UseDiagnosticHintRequest $request, DiagnosticScenarioAttempt $attempt): JsonResponse
    {
        $this->ensureMine($request, $attempt);

        $hint = DiagnosticScenarioHint::findOrFail($request->input('hint_id'));

        $outcome = $this->hintAction->execute($attempt, $request->user(), $hint);
        $outcome['hint']->setAttribute('revealed', true);

        return response()->json([
            'data' => [
                'hint' => (new DiagnosticHintResource($outcome['hint']))->toArray($request),
                'hints_used' => $outcome['hints_used'],
                'penalty_total' => $outcome['penalty_total'],
            ],
        ]);
    }

    /**
     * GET /api/v1/student/scenario-attempts/{attempt}/hints — available hints
     * (content revealed only for used hints) + usage summary.
     */
    public function hints(Request $request, DiagnosticScenarioAttempt $attempt): JsonResponse
    {
        $this->ensureMine($request, $attempt);

        $usages = $attempt->hintUsages()->with('hint')->get();
        $usedHintIds = $usages->pluck('diagnostic_scenario_hint_id')->all();

        $hints = DiagnosticScenarioHint::where('diagnostic_scenario_id', $attempt->diagnostic_scenario_id)
            ->orderBy('position')
            ->get()
            ->map(function (DiagnosticScenarioHint $hint) use ($usedHintIds) {
                $hint->setAttribute('revealed', in_array($hint->id, $usedHintIds, true));

                return $hint;
            });

        return response()->json([
            'data' => DiagnosticHintResource::collection($hints)->toArray($request),
            'meta' => [
                'hints_used' => $usages->count(),
                'hints_remaining' => max(0, $attempt->scenario->hintBudget() - $usages->count()),
                'penalty_total' => (int) $usages->sum('penalty_applied'),
            ],
        ]);
    }

    /**
     * GET /api/v1/student/scenario-attempts/history — paginated attempt history.
     */
    public function history(DiagnosticHistoryRequest $request): JsonResponse
    {
        $paginator = $this->historyQuery->forStudent(
            $request->user(),
            $request->input('scenario_id'),
            (int) $request->input('per_page', 15),
        );

        return response()->json([
            'data' => DiagnosticAttemptResource::collection($paginator->items())->toArray($request),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/student/scenario-attempts/{attempt}/result — persistent result.
     */
    public function result(Request $request, DiagnosticScenarioAttempt $attempt): JsonResponse
    {
        $this->ensureMine($request, $attempt);
        $attempt->load('result');

        if ($attempt->result === null) {
            abort(404, 'Result not yet generated.');
        }

        return response()->json([
            'data' => (new DiagnosticResultResource($attempt->result))->toArray($request),
        ]);
    }

    private function ensureMine(Request $request, DiagnosticScenarioAttempt $attempt): void
    {
        if ($attempt->user_id !== $request->user()->id) {
            abort(404);
        }
    }

    private function presentAttempt(DiagnosticScenarioAttempt $attempt): array
    {
        $attempt->loadMissing(['scenario.dataPack.vehicleVariant.model.make']);
        $steps = $attempt->scenario->steps()->orderBy('position')->get();
        $answers = collect($attempt->evidence['steps'] ?? []);

        return [
            'id' => $attempt->id,
            'scenario_id' => $attempt->diagnostic_scenario_id,
            'attempt_number' => $attempt->attempt_number,
            'status' => $attempt->status->value,
            'started_at' => $attempt->started_at,
            'scenario' => [
                'id' => $attempt->scenario->id,
                'title' => $attempt->scenario->title,
                'description' => $attempt->scenario->description,
                'customer_complaint' => $attempt->scenario->customer_complaint,
                'fault_codes' => $attempt->scenario->fault_codes ?? [],
                'system_tag' => $attempt->scenario->system_tag,
                'passing_score' => $attempt->scenario->passing_score,
                'time_limit' => $attempt->scenario->time_limit,
                'max_hints' => $attempt->scenario->hintBudget(),
                'vehicle' => $this->presentVehicle($attempt->scenario),
            ],
            'steps' => $steps->map(function ($s) use ($answers) {
                $stored = $answers->get($s->id, $answers->get((string) $s->id));

                return array_merge($this->sanitizeStep($s, collect()), [
                    'answered' => $stored !== null,
                    'choice' => $stored['choice'] ?? null,
                ]);
            })->values()->all(),
        ];
    }

    /**
     * Strip configuration and scoring rules — never leak expectations.
     */
    private function sanitizeStep(DiagnosticScenarioStep $step, $answeredIds): array
    {
        $criteriaPoints = (int) DiagnosticScenarioScoringCriterion::where('step_id', $step->id)->sum('points');

        return [
            'id' => $step->id,
            'position' => $step->position,
            'title' => $step->title,
            'description' => $step->description,
            'action_type' => $step->action_type->value,
            'tool' => $step->tool?->value,
            'duration_seconds' => $step->duration_seconds,
            'discipline' => $step->discipline,
            'evidence' => $step->evidence,
            // Safe focus only — never mode/probe/expected answers.
            'bench' => $this->presentBench($step),
            'is_required' => $step->is_required,
            'is_terminal' => $step->is_terminal,
            'criteria_points' => $criteriaPoints,
            'answered' => $answeredIds->contains((string) $step->id),
        ];
    }

    /**
     * Non-sensitive bench focus for tool UIs (multimeter component only).
     */
    private function presentBench(DiagnosticScenarioStep $step): ?array
    {
        if ($step->tool?->value !== 'multimeter') {
            return null;
        }

        $ref = $step->configuration['component_ref'] ?? null;

        return is_string($ref) && $ref !== '' ? ['component_ref' => $ref] : null;
    }

    private function presentVehicle(DiagnosticScenario $scenario): ?array
    {
        $pack = $scenario->dataPack;
        $variant = $pack?->vehicleVariant;
        if ($pack === null || $variant === null) {
            return null;
        }

        $model = $variant->model;
        $make = $model?->make;
        $label = trim(implode(' ', array_filter([
            $make?->name,
            $model?->name,
            $variant->name,
            $variant->engine_code,
        ])));

        return [
            'label' => $label !== '' ? $label : null,
            'make' => $make?->name,
            'model' => $model?->name,
            'variant' => $variant->name,
            'engine_code' => $variant->engine_code,
            'fuel_type' => $variant->fuel_type,
            'transmission' => $variant->transmission,
            'year_from' => $variant->year_from,
            'year_to' => $variant->year_to,
            'vin' => $variant->metadata['vin'] ?? null,
            'odometer_km' => $variant->metadata['odometer_km'] ?? null,
            'pack_version' => $pack->version,
        ];
    }
}
