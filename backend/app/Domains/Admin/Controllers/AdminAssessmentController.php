<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Assessments\Enums\AssessmentStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAssessmentController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        abort_unless(
            $request->user()->hasAnyRole([UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value]),
            403,
            'Administration access required.',
        );
    }

    public function index(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');

        $query = Assessment::query()->with('course:id,title');

        if ($search !== '') {
            $needle = '%'.mb_strtolower($search).'%';
            $query->whereRaw('LOWER(title) LIKE ?', [$needle]);
        }
        if (in_array($status, ['draft', 'published'], true)) {
            $query->where('status', $status);
        }

        $assessments = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        $items = $assessments->getCollection()->map(function (Assessment $assessment) {
            $attempts = AssessmentAttempt::query()->where('assessment_id', $assessment->id);
            $submitted = (clone $attempts)->whereNotNull('submitted_at')->count();
            return [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'status' => $assessment->status instanceof \BackedEnum ? $assessment->status->value : (string) $assessment->status,
                'minimum_score' => $assessment->minimum_score,
                'max_attempts' => $assessment->max_attempts,
                'is_required' => (bool) $assessment->is_required,
                'course' => $assessment->course?->title,
                'attempts_count' => $submitted,
                'pass_rate' => $submitted > 0
                    ? round((float) (clone $attempts)->where('passed', true)->count() / $submitted * 100, 1)
                    : null,
                'updated_at' => $assessment->updated_at?->toISOString(),
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $assessments->currentPage(),
                'last_page' => $assessments->lastPage(),
                'per_page' => $assessments->perPage(),
                'total' => $assessments->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function show(Request $request, Assessment $assessment): JsonResponse
    {
        $this->ensureAdmin($request);

        $assessment->load('course:id,title');

        $attempts = AssessmentAttempt::query()->where('assessment_id', $assessment->id);
        $submitted = (clone $attempts)->whereNotNull('submitted_at')->count();

        $recentAttempts = AssessmentAttempt::query()
            ->with(['user:id,first_name,last_name,email', 'result'])
            ->where('assessment_id', $assessment->id)
            ->latest('submitted_at')
            ->limit(10)
            ->get()
            ->map(function (AssessmentAttempt $attempt) {
                return [
                    'id' => $attempt->id,
                    'student' => $attempt->user?->full_name,
                    'email' => $attempt->user?->email,
                    'score' => $attempt->score,
                    'passed' => (bool) $attempt->passed,
                    'result_score' => $attempt->result?->score,
                    'result_passed' => $attempt->result ? (bool) $attempt->result->passed : null,
                    'attempt_number' => $attempt->attempt_number,
                    'submitted_at' => $attempt->submitted_at?->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'message' => 'Assessment retrieved.',
            'data' => [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'description' => $assessment->description,
                'status' => $assessment->status instanceof \BackedEnum ? $assessment->status->value : (string) $assessment->status,
                'minimum_score' => $assessment->minimum_score,
                'max_attempts' => $assessment->max_attempts,
                'is_required' => (bool) $assessment->is_required,
                'course' => $assessment->course?->title,
                'stats' => [
                    'attempts_count' => $submitted,
                    'pass_rate' => $submitted > 0
                        ? round((float) AssessmentAttempt::query()->where('assessment_id', $assessment->id)->where('passed', true)->count() / $submitted * 100, 1)
                        : null,
                    'results_count' => AssessmentResult::query()->where('assessment_id', $assessment->id)->count(),
                ],
                'recent_attempts' => $recentAttempts,
            ],
        ]);
    }

    public function update(Request $request, Assessment $assessment, AuditService $audit): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:draft,published'],
            'minimum_score' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'max_attempts' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'is_required' => ['sometimes', 'boolean'],
        ]);

        $old = $assessment->only(array_keys($data));
        $assessment->update($data);

        $audit->log('assessment.updated', $assessment, $old, $assessment->only(array_keys($data)));

        return response()->json([
            'success' => true,
            'message' => 'Assessment updated.',
            'data' => ['id' => $assessment->id, 'title' => $assessment->title],
        ]);
    }

    public function disable(Request $request, Assessment $assessment, AuditService $audit): JsonResponse
    {
        $this->ensureAdmin($request);

        $old = $assessment->status instanceof \BackedEnum ? $assessment->status->value : (string) $assessment->status;
        $assessment->update(['status' => AssessmentStatus::DRAFT->value]);

        $audit->log('assessment.disabled', $assessment, ['status' => $old], ['status' => 'draft']);

        return response()->json([
            'success' => true,
            'message' => 'Assessment disabled and returned to draft.',
            'data' => ['id' => $assessment->id],
        ]);
    }

    public function destroy(Request $request, Assessment $assessment, AuditService $audit): JsonResponse
    {
        $this->ensureAdmin($request);

        $audit->log('assessment.deleted', $assessment, ['title' => $assessment->title], []);

        $assessment->delete();

        return response()->json(['message' => 'Assessment deleted successfully.']);
    }

    public function attempts(Request $request, Assessment $assessment): JsonResponse
    {
        $this->ensureAdmin($request);

        $attempts = AssessmentAttempt::query()
            ->with([
                'user:id,first_name,last_name,email',
                'result',
                'answers:id,assessment_attempt_id,question_id,is_correct',
                'answers.question:id,question',
            ])
            ->where('assessment_id', $assessment->id)
            ->latest('submitted_at')
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        $items = $attempts->getCollection()->map(function (AssessmentAttempt $attempt) {
            return [
                'id' => $attempt->id,
                'student' => $attempt->user?->full_name,
                'email' => $attempt->user?->email,
                'score' => $attempt->score,
                'passed' => (bool) $attempt->passed,
                'attempt_number' => $attempt->attempt_number,
                'tab_switch_count' => $attempt->tab_switch_count,
                'result_score' => $attempt->result?->score,
                'result_passed' => $attempt->result ? (bool) $attempt->result->passed : null,
                'submitted_at' => $attempt->submitted_at?->toISOString(),
                'answers' => $attempt->answers->map(fn ($answer) => [
                    'question' => $answer->question?->question,
                    'is_correct' => (bool) $answer->is_correct,
                ]),
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $attempts->currentPage(),
                'last_page' => $attempts->lastPage(),
                'per_page' => $attempts->perPage(),
                'total' => $attempts->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }
}
