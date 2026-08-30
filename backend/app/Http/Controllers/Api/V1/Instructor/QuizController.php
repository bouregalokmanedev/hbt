<?php

namespace App\Http\Controllers\Api\V1\Instructor;

use App\Domains\Instructor\Resources\InstructorQuizResource;
use App\Domains\Quizzes\Actions\CreateQuizQuestionAction;
use App\Domains\Quizzes\Actions\CreateQuizQuestionOptionAction;
use App\Domains\Quizzes\Actions\DeleteQuizAction;
use App\Domains\Quizzes\Actions\DeleteQuizQuestionAction;
use App\Domains\Quizzes\Actions\DeleteQuizQuestionOptionAction;
use App\Domains\Quizzes\Actions\PublishQuizAction;
use App\Domains\Quizzes\Actions\UpdateQuizAction;
use App\Domains\Quizzes\Actions\UpdateQuizQuestionAction;
use App\Domains\Quizzes\Actions\UpdateQuizQuestionOptionAction;
use App\Domains\Quizzes\DTOs\CreateQuizData;
use App\Domains\Quizzes\DTOs\CreateQuizQuestionData;
use App\Domains\Quizzes\DTOs\CreateQuizQuestionOptionData;
use App\Domains\Quizzes\DTOs\UpdateQuizData;
use App\Domains\Quizzes\DTOs\UpdateQuizQuestionData;
use App\Domains\Quizzes\DTOs\UpdateQuizQuestionOptionData;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Domains\Quizzes\Services\CreateQuizService;
use App\Domains\Quizzes\Services\PublishQuizService;
use App\Models\Course;
use App\Models\Section;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

final class QuizController
{
    public function index(Course $course)
    {
        $this->authorizeCourse($course);

        return InstructorQuizResource::collection(
            Quiz::query()
                ->whereHas('section', fn ($query) => $query->where('course_id', $course->id))
                ->with(['questions.options'])
                ->orderBy('position')
                ->get()
        );
    }

    public function store(
        Request $request,
        Course $course,
        CreateQuizService $service,
    ): JsonResponse {
        $this->authorizeCourse($course);
        $data = $this->quizRules($request, false);

        $section = Section::query()
            ->where('course_id', $course->id)
            ->findOrFail($data['section_id']);

        $quiz = $service->execute(new CreateQuizData(
            sectionId: $section->id,
            title: $data['title'],
            slug: $data['slug'] ?? null,
            description: $data['description'] ?? null,
            position: $data['position'] ?? ((int) $section->quizzes()->max('position')) + 1,
            status: QuizStatus::DRAFT,
            passPercentage: $data['pass_percentage'] ?? 70,
            maxAttempts: $data['max_attempts'] ?? null,
            timeLimit: $data['time_limit'] ?? null,
        ));

        return (new InstructorQuizResource($quiz))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Quiz $quiz): InstructorQuizResource
    {
        $this->authorizeQuiz($quiz);

        return new InstructorQuizResource($quiz->load('questions.options'));
    }

    public function update(
        Request $request,
        Quiz $quiz,
        UpdateQuizAction $action,
    ): InstructorQuizResource {
        $this->authorizeQuiz($quiz);
        $data = $this->quizRules($request, true);

        $updated = $action->execute($quiz, UpdateQuizData::fromArray($data));

        return new InstructorQuizResource($updated->load('questions.options'));
    }

    public function destroy(Quiz $quiz, DeleteQuizAction $action): JsonResponse
    {
        $this->authorizeQuiz($quiz);
        $action->execute($quiz);

        return response()->json(status: 204);
    }

    public function publish(Quiz $quiz, PublishQuizService $service): InstructorQuizResource
    {
        $this->authorizeQuiz($quiz);

        return new InstructorQuizResource($service->execute($quiz));
    }

    public function unpublish(Quiz $quiz, UpdateQuizAction $action): InstructorQuizResource
    {
        $this->authorizeQuiz($quiz);

        $quiz = $action->execute($quiz, new UpdateQuizData(status: QuizStatus::DRAFT));

        return new InstructorQuizResource($quiz->load('questions.options'));
    }

    public function storeQuestion(
        Request $request,
        Quiz $quiz,
        CreateQuizQuestionAction $action,
    ): JsonResponse {
        $this->authorizeQuiz($quiz);
        $data = $this->questionRules($request, false);

        $question = $action->execute($quiz, new CreateQuizQuestionData(
            question: $data['question'],
            type: QuizQuestionType::from($data['type']),
            position: $data['position'] ?? ((int) $quiz->questions()->max('position')) + 1,
            points: $data['points'] ?? 1,
            required: $data['required'] ?? true,
        ));

        return response()->json($question->load('options'), 201);
    }

    public function updateQuestion(Request $request, QuizQuestion $question, UpdateQuizQuestionAction $action): JsonResponse
    {
        $this->authorizeQuestion($question);
        $data = $this->questionRules($request, true);

        return response()->json($action->execute($question, new UpdateQuizQuestionData(
            question: $data['question'] ?? null,
            type: isset($data['type']) ? QuizQuestionType::from($data['type']) : null,
            position: $data['position'] ?? null,
            points: $data['points'] ?? null,
            required: $data['required'] ?? null,
        ))->load('options'));
    }

    public function destroyQuestion(QuizQuestion $question, DeleteQuizQuestionAction $action): JsonResponse
    {
        $this->authorizeQuestion($question);
        $action->execute($question);

        return response()->json(status: 204);
    }

    public function storeOption(Request $request, QuizQuestion $question, CreateQuizQuestionOptionAction $action): JsonResponse
    {
        $this->authorizeQuestion($question);
        $data = $this->optionRules($request, false);

        return response()->json($action->execute(new CreateQuizQuestionOptionData(
            questionId: $question->id,
            option: $data['option'],
            isCorrect: $data['is_correct'] ?? false,
            position: $data['position'] ?? ((int) $question->options()->max('position')) + 1,
        ), $question), 201);
    }

    public function updateOption(Request $request, QuizQuestionOption $option, UpdateQuizQuestionOptionAction $action): JsonResponse
    {
        $this->authorizeOption($option);
        $data = $this->optionRules($request, true);

        return response()->json($action->execute($option, new UpdateQuizQuestionOptionData(
            option: $data['option'] ?? null,
            isCorrect: $data['is_correct'] ?? null,
            position: $data['position'] ?? null,
        )));
    }

    public function destroyOption(QuizQuestionOption $option, DeleteQuizQuestionOptionAction $action): JsonResponse
    {
        $this->authorizeOption($option);
        $action->execute($option);

        return response()->json(status: 204);
    }

    private function quizRules(Request $request, bool $partial): array
    {
        $sometimes = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'section_id' => [$partial ? 'sometimes' : 'required', 'uuid', 'exists:sections,id'],
            'title' => [$sometimes, 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'position' => ['sometimes', 'integer', 'min:1'],
            'pass_percentage' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'max_attempts' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'time_limit' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ]);
    }

    private function questionRules(Request $request, bool $partial): array
    {
        return $request->validate([
            'question' => [$partial ? 'sometimes' : 'required', 'string'],
            'type' => [$partial ? 'sometimes' : 'required', Rule::enum(QuizQuestionType::class)],
            'position' => ['sometimes', 'integer', 'min:1'],
            'points' => ['sometimes', 'integer', 'min:1'],
            'required' => ['sometimes', 'boolean'],
        ]);
    }

    private function optionRules(Request $request, bool $partial): array
    {
        return $request->validate([
            'option' => [$partial ? 'sometimes' : 'required', 'string'],
            'is_correct' => ['sometimes', 'boolean'],
            'position' => ['sometimes', 'integer', 'min:1'],
        ]);
    }

    private function authorizeCourse(Course $course): void
    {
        abort_unless(request()->user()?->can('update', $course), 403);
    }

    private function authorizeQuiz(Quiz $quiz): void
    {
        $quiz->loadMissing('section.course');
        $this->authorizeCourse($quiz->section->course);
    }

    private function authorizeQuestion(QuizQuestion $question): void
    {
        $question->loadMissing('quiz.section.course');
        $this->authorizeCourse($question->quiz->section->course);
    }

    private function authorizeOption(QuizQuestionOption $option): void
    {
        $option->loadMissing('question.quiz.section.course');
        $this->authorizeCourse($option->question->quiz->section->course);
    }
}
