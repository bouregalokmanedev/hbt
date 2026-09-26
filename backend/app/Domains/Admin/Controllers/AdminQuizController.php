<?php

namespace App\Domains\Admin\Controllers;

use App\Domains\Quizzes\Actions\DeleteQuizAction;
use App\Domains\Quizzes\Actions\UpdateQuizAction;
use App\Domains\Quizzes\DTOs\UpdateQuizData;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Services\Audit\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminQuizController extends Controller
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

        $query = Quiz::query()->with(['section:id,title,course_id', 'section.course:id,title']);

        if ($search !== '') {
            $needle = '%'.mb_strtolower($search).'%';
            $query->whereRaw('LOWER(title) LIKE ?', [$needle]);
        }
        if (in_array($status, ['draft', 'published', 'archived'], true)) {
            $query->where('status', $status);
        }

        $quizzes = $query->latest()->paginate(min(max($request->integer('per_page', 15), 1), 100));

        $items = $quizzes->getCollection()->map(function (Quiz $quiz) {
            $attempts = QuizAttempt::query()->where('quiz_id', $quiz->id);
            $submitted = (clone $attempts)->whereNotNull('submitted_at')->count();
            return [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'status' => $quiz->status instanceof \BackedEnum ? $quiz->status->value : (string) $quiz->status,
                'pass_percentage' => $quiz->pass_percentage,
                'max_attempts' => $quiz->max_attempts,
                'time_limit' => $quiz->time_limit,
                'course' => $quiz->section?->course?->title,
                'section' => $quiz->section?->title,
                'questions_count' => $quiz->questions()->count(),
                'attempts_count' => $submitted,
                'pass_rate' => $submitted > 0
                    ? round((float) (clone $attempts)->where('passed', true)->count() / $submitted * 100, 1)
                    : null,
                'updated_at' => $quiz->updated_at?->toISOString(),
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => [
                'current_page' => $quizzes->currentPage(),
                'last_page' => $quizzes->lastPage(),
                'per_page' => $quizzes->perPage(),
                'total' => $quizzes->total(),
            ],
            'links' => ['prev' => null, 'next' => null],
        ]);
    }

    public function show(Request $request, Quiz $quiz): JsonResponse
    {
        $this->ensureAdmin($request);

        $quiz->load([
            'section:id,title,course_id',
            'section.course:id,title',
            'questions:id,quiz_id,question,type,position,points',
            'questions.options:id,quiz_question_id,option,is_correct,position',
        ]);

        $attempts = QuizAttempt::query()->where('quiz_id', $quiz->id);
        $submitted = (clone $attempts)->whereNotNull('submitted_at')->count();

        $recentAttempts = QuizAttempt::query()
            ->with('user:id,first_name,last_name,email')
            ->where('quiz_id', $quiz->id)
            ->latest('submitted_at')
            ->limit(10)
            ->get()
            ->map(fn (QuizAttempt $attempt) => [
                'id' => $attempt->id,
                'student' => $attempt->user?->full_name,
                'email' => $attempt->user?->email,
                'score' => $attempt->score,
                'total_points' => $attempt->total_points,
                'percentage' => $attempt->percentage,
                'passed' => (bool) $attempt->passed,
                'attempt_number' => $attempt->attempt_number,
                'submitted_at' => $attempt->submitted_at?->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Quiz retrieved.',
            'data' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'slug' => $quiz->slug,
                'description' => $quiz->description,
                'status' => $quiz->status instanceof \BackedEnum ? $quiz->status->value : (string) $quiz->status,
                'pass_percentage' => $quiz->pass_percentage,
                'max_attempts' => $quiz->max_attempts,
                'time_limit' => $quiz->time_limit,
                'course' => $quiz->section?->course?->title,
                'section' => $quiz->section?->title,
                'stats' => [
                    'questions_count' => $quiz->questions->count(),
                    'attempts_count' => $submitted,
                    'pass_rate' => $submitted > 0
                        ? round((float) QuizAttempt::query()->where('quiz_id', $quiz->id)->where('passed', true)->count() / $submitted * 100, 1)
                        : null,
                    'average_percentage' => $submitted > 0
                        ? round((float) QuizAttempt::query()->where('quiz_id', $quiz->id)->whereNotNull('percentage')->avg('percentage'), 1)
                        : null,
                ],
                'questions' => $quiz->questions->sortBy('position')->values()->map(fn ($question) => [
                    'id' => $question->id,
                    'question' => $question->question,
                    'type' => $question->type instanceof \BackedEnum ? $question->type->value : (string) $question->type,
                    'position' => $question->position,
                    'points' => $question->points,
                    'options' => $question->options->sortBy('position')->values()->map(fn ($option) => [
                        'id' => $option->id,
                        'option' => $option->option,
                        'is_correct' => (bool) $option->is_correct,
                    ]),
                ]),
                'recent_attempts' => $recentAttempts,
            ],
        ]);
    }

    public function update(Request $request, Quiz $quiz, UpdateQuizAction $update, AuditService $audit): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'string', 'in:draft,published,archived'],
            'pass_percentage' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'max_attempts' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'time_limit' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ]);

        $old = $quiz->only(array_keys($data));

        $updated = $update->execute($quiz, UpdateQuizData::fromArray($data));

        $audit->log('quiz.updated', $updated, $old, $updated->only(array_keys($data)));

        return response()->json([
            'success' => true,
            'message' => 'Quiz updated.',
            'data' => ['id' => $updated->id, 'title' => $updated->title],
        ]);
    }

    public function disable(Request $request, Quiz $quiz, UpdateQuizAction $update, AuditService $audit): JsonResponse
    {
        $this->ensureAdmin($request);

        $updated = $update->execute($quiz, UpdateQuizData::fromArray(['status' => QuizStatus::DRAFT->value]));

        $audit->log('quiz.disabled', $updated, ['status' => $quiz->status->value ?? (string) $quiz->status], ['status' => 'draft']);

        return response()->json([
            'success' => true,
            'message' => 'Quiz disabled and returned to draft.',
            'data' => ['id' => $updated->id],
        ]);
    }

    public function destroy(Request $request, Quiz $quiz, DeleteQuizAction $delete, AuditService $audit): JsonResponse
    {
        $this->ensureAdmin($request);

        $audit->log('quiz.deleted', $quiz, ['title' => $quiz->title], []);

        $delete->execute($quiz);

        return response()->json(['message' => 'Quiz deleted successfully.']);
    }

    public function attempts(Request $request, Quiz $quiz): JsonResponse
    {
        $this->ensureAdmin($request);

        $attempts = QuizAttempt::query()
            ->with([
                'user:id,first_name,last_name,email',
                'answers:id,attempt_id,question_id,is_correct,points_earned',
                'answers.question:id,question,points',
            ])
            ->where('quiz_id', $quiz->id)
            ->latest('submitted_at')
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        $items = $attempts->getCollection()->map(fn (QuizAttempt $attempt) => [
            'id' => $attempt->id,
            'student' => $attempt->user?->full_name,
            'email' => $attempt->user?->email,
            'score' => $attempt->score,
            'total_points' => $attempt->total_points,
            'percentage' => $attempt->percentage,
            'passed' => (bool) $attempt->passed,
            'attempt_number' => $attempt->attempt_number,
            'tab_switch_count' => $attempt->tab_switch_count,
            'submitted_at' => $attempt->submitted_at?->toISOString(),
            'answers' => $attempt->answers->map(fn ($answer) => [
                'question' => $answer->question?->question,
                'is_correct' => (bool) $answer->is_correct,
                'points_earned' => $answer->points_earned,
                'question_points' => $answer->question?->points,
            ]),
        ]);

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
