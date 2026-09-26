<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticActionType;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioStatus;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioScoringCriterion;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\DiagnosticScenarios\Queries\DiagnosticAnalyticsQuery;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class AdminDiagnosticController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        abort_unless(
            $request->user()->hasAnyRole([UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value]),
            403,
            'Administration access required.',
        );
    }

    private function ensureDraft(DiagnosticScenario $scenario): void
    {
        abort_if(
            $scenario->status !== DiagnosticScenarioStatus::DRAFT,
            409,
            'Published scenarios are immutable. Fork a new version instead.',
        );
    }

    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');

        $query = DiagnosticScenario::query()->with(['course:id,title'])->withCount(['steps', 'hints']);

        if ($search !== '') {
            $needle = '%'.mb_strtolower($search).'%';
            $query->whereRaw('LOWER(title) LIKE ?', [$needle]);
        }
        if (in_array($status, ['draft', 'published', 'archived'], true)) {
            $query->where('status', $status);
        }

        $scenarios = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        $items = $scenarios->getCollection()->map(function (DiagnosticScenario $scenario) {
            $attempts = DiagnosticScenarioAttempt::query()->where('diagnostic_scenario_id', $scenario->id);
            $submitted = (clone $attempts)->where('status', 'submitted')->count();

            return [
                'id' => $scenario->id,
                'title' => $scenario->title,
                'slug' => $scenario->slug,
                'version' => $scenario->version ?? 1,
                'status' => $scenario->status->value,
                'course' => $scenario->course?->title,
                'course_id' => $scenario->course_id,
                'passing_score' => $scenario->passing_score,
                'is_required' => $scenario->is_required,
                'steps_count' => $scenario->steps_count,
                'hints_count' => $scenario->hints_count,
                'assignments_count' => $scenario->courseAssignments()->count(),
                'attempts_count' => $submitted,
                'pass_rate' => $submitted > 0
                    ? round((float) (clone $attempts)->where('passed', true)->count() / $submitted * 100, 1)
                    : null,
                'updated_at' => $scenario->updated_at?->toISOString(),
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $scenarios->currentPage(),
                'last_page' => $scenarios->lastPage(),
                'per_page' => $scenarios->perPage(),
                'total' => $scenarios->total(),
            ],
        ]);
    }

    public function show(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->ensureAdmin($request);

        $scenario->load([
            'course:id,title',
            'steps' => fn ($q) => $q->orderBy('position'),
            'scoringCriteria' => fn ($q) => $q->orderBy('position'),
            'hints' => fn ($q) => $q->orderBy('position'),
            'courseAssignments.course:id,title',
        ]);

        $recentAttempts = DiagnosticScenarioAttempt::query()
            ->with('user:id,first_name,last_name,email')
            ->where('diagnostic_scenario_id', $scenario->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (DiagnosticScenarioAttempt $attempt) => [
                'id' => $attempt->id,
                'student' => $attempt->user?->full_name,
                'email' => $attempt->user?->email,
                'score' => $attempt->score,
                'passed' => (bool) $attempt->passed,
                'status' => $attempt->status->value,
                'attempt_number' => $attempt->attempt_number,
                'scenario_version' => $attempt->scenario_version ?? 1,
                'submitted_at' => $attempt->submitted_at?->toISOString(),
            ]);

        return response()->json([
            'data' => [
                'id' => $scenario->id,
                'title' => $scenario->title,
                'slug' => $scenario->slug,
                'version' => $scenario->version ?? 1,
                'supersedes_id' => $scenario->supersedes_id,
                'description' => $scenario->description,
                'status' => $scenario->status->value,
                'course' => $scenario->course ? ['id' => $scenario->course->id, 'title' => $scenario->course->title] : null,
                'passing_score' => $scenario->passing_score,
                'time_limit' => $scenario->time_limit,
                'is_required' => $scenario->is_required,
                'position' => $scenario->position,
                'published_at' => $scenario->published_at?->toISOString(),
                'steps' => $scenario->steps->map(fn ($s) => [
                    'id' => $s->id,
                    'position' => $s->position,
                    'title' => $s->title,
                    'description' => $s->description,
                    'action_type' => $s->action_type->value,
                    'configuration' => $s->configuration,
                    'evidence' => $s->evidence,
                    'is_required' => $s->is_required,
                    'is_terminal' => $s->is_terminal,
                ])->values()->all(),
                'scoring_criteria' => $scenario->scoringCriteria->map(fn ($c) => [
                    'id' => $c->id,
                    'step_id' => $c->step_id,
                    'key' => $c->key,
                    'title' => $c->title,
                    'points' => $c->points,
                    'evaluation_type' => $c->evaluation_type,
                    'rules' => $c->rules,
                    'position' => $c->position,
                ])->values()->all(),
                'hints' => $scenario->hints->map(fn ($h) => [
                    'id' => $h->id,
                    'step_id' => $h->diagnostic_scenario_step_id,
                    'level' => $h->level,
                    'title' => $h->title,
                    'content' => $h->content,
                    'penalty_points' => $h->penalty_points,
                    'position' => $h->position,
                ])->values()->all(),
                'assignments' => $scenario->courseAssignments->map(fn ($a) => [
                    'id' => $a->id,
                    'course' => $a->course ? ['id' => $a->course->id, 'title' => $a->course->title] : null,
                    'position' => $a->position,
                    'is_required' => $a->is_required,
                    'min_score' => $a->min_score,
                    'max_attempts' => $a->max_attempts,
                    'available_from' => $a->available_from?->toISOString(),
                    'available_until' => $a->available_until?->toISOString(),
                ])->values()->all(),
                'recent_attempts' => $recentAttempts,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'course_id' => ['required', 'uuid', 'exists:courses,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'customer_complaint' => ['nullable', 'string', 'max:2000'],
            'fault_codes' => ['nullable', 'array'],
            'fault_codes.*' => ['string', 'max:32'],
            'system_tag' => ['nullable', 'string', 'max:64'],
            'data_pack_id' => ['nullable', 'uuid', 'exists:simulator_data_packs,id'],
            'passing_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'time_limit' => ['nullable', 'integer', 'min:1'],
            'max_hints' => ['nullable', 'integer', 'min:0', 'max:10'],
            'is_required' => ['nullable', 'boolean'],
        ]);

        $slug = Str::slug($validated['title']).'-'.Str::lower(Str::random(6));
        $position = (int) (DiagnosticScenario::where('course_id', $validated['course_id'])->max('position') ?? 0) + 1;

        $scenario = DiagnosticScenario::create([
            'course_id' => $validated['course_id'],
            'data_pack_id' => $validated['data_pack_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $slug,
            'version' => 1,
            'description' => $validated['description'] ?? null,
            'customer_complaint' => $validated['customer_complaint'] ?? null,
            'fault_codes' => $validated['fault_codes'] ?? null,
            'system_tag' => $validated['system_tag'] ?? null,
            'position' => $position,
            'passing_score' => $validated['passing_score'] ?? 70,
            'time_limit' => $validated['time_limit'] ?? null,
            'max_hints' => $validated['max_hints'] ?? 3,
            'status' => DiagnosticScenarioStatus::DRAFT,
            'is_required' => $validated['is_required'] ?? true,
        ]);

        return response()->json(['data' => ['id' => $scenario->id, 'slug' => $scenario->slug, 'version' => 1]], 201);
    }

    public function update(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'customer_complaint' => ['nullable', 'string', 'max:2000'],
            'fault_codes' => ['nullable', 'array'],
            'fault_codes.*' => ['string', 'max:32'],
            'system_tag' => ['nullable', 'string', 'max:64'],
            'data_pack_id' => ['nullable', 'uuid', 'exists:simulator_data_packs,id'],
            'passing_score' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'time_limit' => ['nullable', 'integer', 'min:1'],
            'max_hints' => ['nullable', 'integer', 'min:0', 'max:10'],
            'is_required' => ['sometimes', 'boolean'],
        ]);

        $scenario->update($validated);

        return response()->json(['data' => ['id' => $scenario->id]]);
    }

    public function publish(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->ensureAdmin($request);

        abort_if($scenario->status === DiagnosticScenarioStatus::PUBLISHED, 409, 'Scenario is already published.');

        $requiredSteps = $scenario->steps()->where('is_required', true)->count();
        abort_if($requiredSteps === 0, 422, 'A scenario needs at least one required step before publishing.');

        $scenario->update([
            'status' => DiagnosticScenarioStatus::PUBLISHED,
            'published_at' => now(),
        ]);

        return response()->json(['data' => ['id' => $scenario->id, 'status' => 'published']]);
    }

    public function unpublish(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->ensureAdmin($request);

        $scenario->update([
            'status' => DiagnosticScenarioStatus::DRAFT,
            'published_at' => null,
        ]);

        return response()->json(['data' => ['id' => $scenario->id, 'status' => 'draft']]);
    }

    public function archive(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->ensureAdmin($request);

        $scenario->update(['status' => DiagnosticScenarioStatus::ARCHIVED]);

        return response()->json(['data' => ['id' => $scenario->id, 'status' => 'archived']]);
    }

    /**
     * Fork a new immutable version: copies steps, scoring criteria and hints.
     * Attempts pinned to prior versions keep scoring against their version.
     */
    public function forkVersion(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->ensureAdmin($request);

        $next = DB::transaction(function () use ($scenario) {
            $scenario->load(['steps', 'scoringCriteria', 'hints']);

            $newVersion = ((int) ($scenario->version ?? 1)) + 1;

            $copy = DiagnosticScenario::create([
                'course_id' => $scenario->course_id,
                'title' => $scenario->title,
                'slug' => $scenario->slug.'-v'.$newVersion,
                'version' => $newVersion,
                'supersedes_id' => $scenario->id,
                'description' => $scenario->description,
                // Versions are distinct rows; the copy goes to the end of the
                // course ordering (unique [course_id, position]).
                'position' => ((int) (DiagnosticScenario::where('course_id', $scenario->course_id)->max('position') ?? 0)) + 1,
                'passing_score' => $scenario->passing_score,
                'time_limit' => $scenario->time_limit,
                'status' => DiagnosticScenarioStatus::DRAFT,
                'is_required' => $scenario->is_required,
            ]);

            $stepMap = [];
            foreach ($scenario->steps as $step) {
                $stepCopy = DiagnosticScenarioStep::create([
                    'diagnostic_scenario_id' => $copy->id,
                    'position' => $step->position,
                    'title' => $step->title,
                    'description' => $step->description,
                    'action_type' => $step->action_type,
                    'configuration' => $step->configuration,
                    'evidence' => $step->evidence,
                    'is_required' => $step->is_required,
                    'is_terminal' => $step->is_terminal,
                ]);
                $stepMap[$step->id] = $stepCopy->id;
            }

            foreach ($scenario->scoringCriteria as $criterion) {
                DiagnosticScenarioScoringCriterion::create([
                    'diagnostic_scenario_id' => $copy->id,
                    'step_id' => $criterion->step_id !== null ? ($stepMap[$criterion->step_id] ?? null) : null,
                    'key' => $criterion->key,
                    'title' => $criterion->title,
                    'description' => $criterion->description,
                    'points' => $criterion->points,
                    'evaluation_type' => $criterion->evaluation_type,
                    'rules' => $criterion->rules,
                    'is_required' => $criterion->is_required,
                    'position' => $criterion->position,
                ]);
            }

            foreach ($scenario->hints as $hint) {
                DiagnosticScenarioHint::create([
                    'diagnostic_scenario_id' => $copy->id,
                    'diagnostic_scenario_step_id' => $hint->diagnostic_scenario_step_id !== null
                        ? ($stepMap[$hint->diagnostic_scenario_step_id] ?? null)
                        : null,
                    'level' => $hint->level,
                    'title' => $hint->title,
                    'content' => $hint->content,
                    'penalty_points' => $hint->penalty_points,
                    'position' => $hint->position,
                ]);
            }

            return $copy;
        });

        return response()->json([
            'data' => ['id' => $next->id, 'version' => $next->version, 'supersedes_id' => $next->supersedes_id],
        ], 201);
    }

    public function storeStep(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->ensureDraft($scenario);

        $validated = $request->validate([
            'position' => ['nullable', 'integer', 'min:1'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'action_type' => ['required', new Enum(DiagnosticActionType::class)],
            'configuration' => ['nullable', 'array'],
            'evidence' => ['nullable', 'array'],
            'is_required' => ['nullable', 'boolean'],
            'is_terminal' => ['nullable', 'boolean'],
        ]);

        $position = $validated['position']
            ?? ((int) ($scenario->steps()->max('position') ?? 0) + 1);

        abort_if(
            $scenario->steps()->where('position', $position)->exists(),
            422,
            'A step already exists at this position.',
        );

        $step = DiagnosticScenarioStep::create([
            'diagnostic_scenario_id' => $scenario->id,
            'position' => $position,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'action_type' => DiagnosticActionType::from($validated['action_type']),
            'configuration' => $validated['configuration'] ?? null,
            'evidence' => $validated['evidence'] ?? null,
            'is_required' => $validated['is_required'] ?? true,
            'is_terminal' => $validated['is_terminal'] ?? false,
        ]);

        return response()->json(['data' => ['id' => $step->id, 'position' => $step->position]], 201);
    }

    public function updateStep(Request $request, DiagnosticScenarioStep $step): JsonResponse
    {
        $this->ensureAdmin($request);
        $step->loadMissing('scenario');
        $this->ensureDraft($step->scenario);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'action_type' => ['sometimes', new Enum(DiagnosticActionType::class)],
            'configuration' => ['nullable', 'array'],
            'evidence' => ['nullable', 'array'],
            'is_required' => ['sometimes', 'boolean'],
            'is_terminal' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['action_type'])) {
            $validated['action_type'] = DiagnosticActionType::from($validated['action_type']);
        }

        $step->update($validated);

        return response()->json(['data' => ['id' => $step->id]]);
    }

    public function destroyStep(Request $request, DiagnosticScenarioStep $step): JsonResponse
    {
        $this->ensureAdmin($request);
        $step->loadMissing('scenario');
        $this->ensureDraft($step->scenario);

        DB::transaction(function () use ($step) {
            DiagnosticScenarioScoringCriterion::where('step_id', $step->id)->delete();
            DiagnosticScenarioHint::where('diagnostic_scenario_step_id', $step->id)->delete();
            $step->delete();
        });

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function storeCriterion(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->ensureDraft($scenario);

        $validated = $request->validate([
            'step_id' => [
                'nullable', 'uuid',
                Rule::exists('diagnostic_scenario_steps', 'id')->where('diagnostic_scenario_id', $scenario->id),
            ],
            'key' => ['required', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'points' => ['required', 'integer', 'min:1', 'max:100'],
            'evaluation_type' => ['required', Rule::in(['boolean', 'contains', 'numeric_range', 'set_match'])],
            'rules' => ['nullable', 'array'],
            'is_required' => ['nullable', 'boolean'],
        ]);

        abort_if(
            DiagnosticScenarioScoringCriterion::where('diagnostic_scenario_id', $scenario->id)
                ->where('key', $validated['key'])->exists(),
            422,
            'A criterion with this key already exists for the scenario.',
        );

        $position = (int) ($scenario->scoringCriteria()->max('position') ?? 0) + 1;

        $criterion = DiagnosticScenarioScoringCriterion::create([
            'diagnostic_scenario_id' => $scenario->id,
            'step_id' => $validated['step_id'] ?? null,
            'key' => $validated['key'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'points' => $validated['points'],
            'evaluation_type' => $validated['evaluation_type'],
            'rules' => $validated['rules'] ?? null,
            'is_required' => $validated['is_required'] ?? true,
            'position' => $position,
        ]);

        return response()->json(['data' => ['id' => $criterion->id]], 201);
    }

    public function updateCriterion(Request $request, DiagnosticScenarioScoringCriterion $criterion): JsonResponse
    {
        $this->ensureAdmin($request);
        $criterion->loadMissing('scenario');
        $this->ensureDraft($criterion->scenario);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'points' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'evaluation_type' => ['sometimes', Rule::in(['boolean', 'contains', 'numeric_range', 'set_match'])],
            'rules' => ['nullable', 'array'],
            'is_required' => ['sometimes', 'boolean'],
        ]);

        $criterion->update($validated);

        return response()->json(['data' => ['id' => $criterion->id]]);
    }

    public function destroyCriterion(Request $request, DiagnosticScenarioScoringCriterion $criterion): JsonResponse
    {
        $this->ensureAdmin($request);
        $criterion->loadMissing('scenario');
        $this->ensureDraft($criterion->scenario);

        $criterion->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function storeHint(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->ensureDraft($scenario);

        $validated = $request->validate([
            'diagnostic_scenario_step_id' => [
                'nullable', 'uuid',
                Rule::exists('diagnostic_scenario_steps', 'id')->where('diagnostic_scenario_id', $scenario->id),
            ],
            'level' => ['nullable', 'integer', 'min:1', 'max:3'],
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'penalty_points' => ['nullable', 'integer', 'min:0', 'max:50'],
        ]);

        $position = (int) ($scenario->hints()->max('position') ?? 0) + 1;

        $hint = DiagnosticScenarioHint::create([
            'diagnostic_scenario_id' => $scenario->id,
            'diagnostic_scenario_step_id' => $validated['diagnostic_scenario_step_id'] ?? null,
            'level' => $validated['level'] ?? 1,
            'title' => $validated['title'] ?? null,
            'content' => $validated['content'],
            'penalty_points' => $validated['penalty_points'] ?? 5,
            'position' => $position,
        ]);

        return response()->json(['data' => ['id' => $hint->id]], 201);
    }

    public function updateHint(Request $request, DiagnosticScenarioHint $hint): JsonResponse
    {
        $this->ensureAdmin($request);
        $hint->loadMissing('scenario');
        $this->ensureDraft($hint->scenario);

        $validated = $request->validate([
            'level' => ['sometimes', 'integer', 'min:1', 'max:3'],
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['sometimes', 'string'],
            'penalty_points' => ['sometimes', 'integer', 'min:0', 'max:50'],
        ]);

        $hint->update($validated);

        return response()->json(['data' => ['id' => $hint->id]]);
    }

    public function destroyHint(Request $request, DiagnosticScenarioHint $hint): JsonResponse
    {
        $this->ensureAdmin($request);
        $hint->loadMissing('scenario');
        $this->ensureDraft($hint->scenario);

        abort_if($hint->usages()->exists(), 409, 'Hint has recorded usages and cannot be deleted.');

        $hint->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function storeAssignment(Request $request, DiagnosticScenario $scenario): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'course_id' => ['required', 'uuid', 'exists:courses,id'],
            'is_required' => ['nullable', 'boolean'],
            'min_score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'max_attempts' => ['nullable', 'integer', 'min:1'],
            'available_from' => ['nullable', 'date'],
            'available_until' => ['nullable', 'date', 'after:available_from'],
        ]);

        abort_if(
            CourseDiagnosticScenario::where('course_id', $validated['course_id'])
                ->where('diagnostic_scenario_id', $scenario->id)->exists(),
            422,
            'This scenario is already assigned to the course.',
        );

        $position = (int) (CourseDiagnosticScenario::where('course_id', $validated['course_id'])->max('position') ?? 0) + 1;

        $assignment = CourseDiagnosticScenario::create([
            'course_id' => $validated['course_id'],
            'diagnostic_scenario_id' => $scenario->id,
            'position' => $position,
            'is_required' => $validated['is_required'] ?? true,
            'min_score' => $validated['min_score'] ?? $scenario->passing_score,
            'max_attempts' => $validated['max_attempts'] ?? null,
            'available_from' => $validated['available_from'] ?? null,
            'available_until' => $validated['available_until'] ?? null,
        ]);

        return response()->json(['data' => ['id' => $assignment->id]], 201);
    }

    public function destroyAssignment(Request $request, CourseDiagnosticScenario $assignment): JsonResponse
    {
        $this->ensureAdmin($request);

        $assignment->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function analytics(Request $request, DiagnosticAnalyticsQuery $query): JsonResponse
    {
        $this->ensureAdmin($request);

        $validated = $request->validate([
            'course_id' => ['nullable', 'uuid', 'exists:courses,id'],
        ]);

        return response()->json(['data' => $query->overview($validated['course_id'] ?? null)]);
    }
}
