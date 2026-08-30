<?php

namespace App\Http\Controllers\Api\V1;

use App\Domains\Quizzes\Actions\StartQuizAttemptAction;
use App\Domains\Quizzes\Actions\SubmitQuizAttemptAction;
use App\Domains\Quizzes\DTOs\SubmitQuizAttemptData;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Quizzes\StartQuizAttemptRequest;
use App\Http\Requests\Api\V1\Quizzes\SubmitQuizAttemptRequest;
use App\Http\Resources\Api\V1\Quizzes\QuizAttemptResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Domains\Quizzes\Enums\QuizAttemptStatus;


final class QuizAttemptController extends Controller
{
    public function __construct(
        private readonly StartQuizAttemptAction $startQuizAttemptAction,
        private readonly SubmitQuizAttemptAction $submitQuizAttemptAction,
    ) {
    }

    /**
     * List the authenticated user's attempts for a quiz.
     */
    public function index(
        Request $request,
        Quiz $quiz,
    ): JsonResponse {
        $attempts = QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $request->user()->id)
            ->latest('attempt_number')
            ->get();

        return response()->json([
            'data' => QuizAttemptResource::collection($attempts),
        ]);
    }

    /**
     * Start or resume a quiz attempt.
     */
    public function store(
        StartQuizAttemptRequest $request,
        Quiz $quiz,
    ): QuizAttemptResource {
        $attempt = $this->startQuizAttemptAction->execute(
            quiz: $quiz,
            user: $request->user(),
        );

        $attempt->load([
            'quiz.questions.options',
            'answers.selectedOptions',
        ]);

        return new QuizAttemptResource($attempt);
    }

    /**
     * Show a specific attempt.
     */
    public function show(
        Request $request,
        Quiz $quiz,
        QuizAttempt $attempt,
    ): QuizAttemptResource {
        $this->ensureAttemptBelongsToUser(
            $request,
            $quiz,
            $attempt,
        );

        if ($attempt->expires_at?->isPast()) {
            $attempt->update(['status' => QuizAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
            abort(422, 'Time expired. You can retake this quiz one hour after the timeout.');
        }

        $attempt->load([
            'quiz.questions.options',
            'answers.selectedOptions',
        ]);

        return new QuizAttemptResource($attempt);
    }

    public function expire(Request $request, Quiz $quiz, QuizAttempt $attempt): JsonResponse
    {
        $this->ensureAttemptBelongsToUser($request, $quiz, $attempt);
        if ($attempt->status === QuizAttemptStatus::IN_PROGRESS) {
            $attempt->update(['status' => QuizAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
        }
        return response()->json(['message' => 'Time expired. You can retake this quiz in one hour.']);
    }

    public function tabSwitch(Request $request, Quiz $quiz, QuizAttempt $attempt): JsonResponse
    {
        $this->ensureAttemptBelongsToUser($request, $quiz, $attempt);
        if ($attempt->status === QuizAttemptStatus::IN_PROGRESS) {
            $count = $attempt->tab_switch_count + 1;
            $attempt->update(['tab_switch_count' => $count, 'blocked_at' => $count >= 3 ? now() : null, 'status' => $count >= 3 ? QuizAttemptStatus::EXPIRED : QuizAttemptStatus::IN_PROGRESS, 'timed_out_at' => $count >= 3 ? now() : null]);
        }
        return response()->json(['data' => ['tab_switch_count' => $attempt->fresh()->tab_switch_count, 'blocked' => $attempt->fresh()->blocked_at !== null]]);
    }

    /**
     * Submit a quiz attempt.
     */
    public function submit(
        SubmitQuizAttemptRequest $request,
        Quiz $quiz,
        QuizAttempt $attempt,
    ): QuizAttemptResource {
        $this->ensureAttemptBelongsToUser(
            $request,
            $quiz,
            $attempt,
        );

        $data = new SubmitQuizAttemptData(
            $request->validated('answers')
        );

        $attempt = $this->submitQuizAttemptAction->execute(
            $attempt,
            $data,
        );

        $attempt->load([
            'quiz.questions.options',
            'answers.selectedOptions',
        ]);

        return new QuizAttemptResource($attempt);
    }

    /**
     * Show the final result.
     */
  public function result(
    Request $request,
    Quiz $quiz,
    QuizAttempt $attempt,
): QuizAttemptResource {
    $this->ensureAttemptBelongsToUser(
        $request,
        $quiz,
        $attempt,
    );

    if ($attempt->status === QuizAttemptStatus::IN_PROGRESS) {
        abort(
            409,
            'Quiz attempt has not been submitted yet.'
        );
    }

    $attempt->load([
        'quiz.questions.options',
        'answers.selectedOptions',
    ]);

    return new QuizAttemptResource($attempt);
}

    private function ensureAttemptBelongsToUser(
        Request $request,
        Quiz $quiz,
        QuizAttempt $attempt,
    ): void {
        if (
            $attempt->quiz_id !== $quiz->id ||
            $attempt->user_id !== $request->user()->id
        ) {
            abort(404);
        }
    }
}
