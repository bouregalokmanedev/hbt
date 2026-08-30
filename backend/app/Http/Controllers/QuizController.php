<?php

namespace App\Http\Controllers;
use App\Domains\Quizzes\DTOs\CreateQuizQuestionData;
use App\Domains\Quizzes\DTOs\CreateQuizQuestionOptionData;
use App\Domains\Quizzes\DTOs\CreateQuizData;
use App\Domains\Quizzes\Enums\QuizStatus;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Http\Requests\CreateQuizRequest;
use App\Domains\Quizzes\Http\Resources\QuizResource;
use App\Domains\Quizzes\Services\CreateQuizService;
use App\Domains\Quizzes\Models\Quiz;
use App\Models\Course;
use Illuminate\Http\JsonResponse;

final class QuizController
{
    public function __construct(
        private CreateQuizService $createQuizService,
    ) {
    }

   public function store(CreateQuizRequest $request): QuizResource
{
    $validated = $request->validated();

    $quizData = new CreateQuizData(
        sectionId: $validated['section_id'],
        title: $validated['title'],
        slug: $validated['slug'] ?? null,
        description: $validated['description'] ?? null,
        position: $validated['position'] ?? 1,
        status: isset($validated['status'])
            ? QuizStatus::from($validated['status'])
            : QuizStatus::DRAFT,
        passPercentage: $validated['pass_percentage'] ?? 70,
        maxAttempts: $validated['max_attempts'] ?? null,
        timeLimit: $validated['time_limit'] ?? null,
    );

    $questions = [];

    foreach ($validated['questions'] ?? [] as $questionIndex => $question) {
        $options = [];

        foreach ($question['options'] ?? [] as $optionIndex => $option) {
            $options[] = new CreateQuizQuestionOptionData(
                option: $option['option'],
                isCorrect: (bool) ($option['is_correct'] ?? false),
                position: (int) ($option['position'] ?? ($optionIndex + 1)),
            );
        }

        $questions[] = new CreateQuizQuestionData(
            question: $question['question'],
            type: $question['type'] instanceof QuizQuestionType
                ? $question['type']
                : QuizQuestionType::from($question['type']),
            position: (int) ($question['position'] ?? ($questionIndex + 1)),
            points: (int) ($question['points'] ?? 1),
            required: (bool) ($question['required'] ?? true),
            options: $options,
        );
    }

    $quiz = $this->createQuizService->execute(
        $quizData,
        $questions,
    );

    return new QuizResource($quiz);
}
public function show(Quiz $quiz): QuizResource
{
    $quiz->load([
        'questions.options',
    ]);

    return new QuizResource($quiz);
}

public function courseQuizzes(Course $course): JsonResponse
{
    $quizzes = Quiz::query()
        ->whereHas('section', fn ($query) => $query->where('course_id', $course->id))
        ->where('status', QuizStatus::PUBLISHED)
        ->withCount('questions')
        ->orderBy('position')
        ->get()
        ->map(fn (Quiz $quiz) => [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'description' => $quiz->description,
            'pass_percentage' => $quiz->pass_percentage,
            'time_limit' => $quiz->time_limit,
            'questions_count' => $quiz->questions_count,
        ]);

    return response()->json(['data' => $quizzes]);
}
}
