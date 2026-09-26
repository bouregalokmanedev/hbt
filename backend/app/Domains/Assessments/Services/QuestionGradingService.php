<?php

namespace App\Domains\Assessments\Services;

use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\StudentAssessments\Enums\ConfidenceLevel;
use LogicException;

final class QuestionGradingService
{
    public function __construct(
        private readonly AIEvaluationService $aiEvaluation,
    ) {}
    /**
     * Dispatch grading by question type.
     *
     * Supported payload per submitted answer (dispatched on question type):
     * - single_choice / multiple_choice / true_false: option_ids[] (legacy),
     *   selected_option_ids[] or selected_option_id
     * - short_answer: value (string)
     * - numeric: value (number)
     * - ordering: ordered_ids[]
     * - matching: matches ({left: right} or [{left, right}])
     * An optional confidence_level may accompany any answer.
     *
     * @return array{points_earned: int, is_correct: bool, fraction: float, normalized_answer: array, selected_option_ids: array, evidence: array, feedback: string, evaluation_status: string}
     */
    public function grade(QuizQuestion $question, array $submittedAnswer, int $questionPoints): array
    {
        $grade = match ($question->type) {
            QuizQuestionType::SINGLE_CHOICE,
            QuizQuestionType::MULTIPLE_CHOICE,
            QuizQuestionType::TRUE_FALSE => $this->gradeOptions($question, $submittedAnswer, $questionPoints),
            QuizQuestionType::SHORT_ANSWER => $this->gradeShortAnswer($question, $submittedAnswer, $questionPoints),
            QuizQuestionType::NUMERIC => $this->gradeNumeric($question, $submittedAnswer, $questionPoints),
            QuizQuestionType::ORDERING => $this->gradeOrdering($question, $submittedAnswer, $questionPoints),
            QuizQuestionType::MATCHING => $this->gradeMatching($question, $submittedAnswer, $questionPoints),
            QuizQuestionType::LONG_ANSWER => $this->gradeLongAnswer($question, $submittedAnswer, $questionPoints),
        };

        $grade['evaluation_status'] = $grade['evaluation_status'] ?? 'evaluated';

        return $grade;
    }

    private function gradeLongAnswer(QuizQuestion $question, array $submittedAnswer, int $questionPoints): array
    {
        $raw = $submittedAnswer['value'] ?? $submittedAnswer['text'] ?? $submittedAnswer['answer'] ?? null;

        $result = $this->aiEvaluation->gradeLongAnswer($question, $raw, $questionPoints);

        return [
            'points_earned' => $result['points_earned'],
            'is_correct' => $result['is_correct'],
            'fraction' => $result['fraction'],
            'normalized_answer' => ['value' => is_string($raw) || is_numeric($raw) ? trim((string) $raw) : $raw],
            'selected_option_ids' => [],
            'evidence' => [
                'criteria' => $result['criteria'],
                'pending_review' => $result['pending_review'],
            ],
            'feedback' => $result['feedback'],
            'evaluation_status' => $result['pending_review'] ? 'pending_review' : 'ai_graded',
        ];
    }

    private function gradeOptions(QuizQuestion $question, array $submittedAnswer, int $questionPoints): array
    {
        $selectedOptionIds = collect(
            $submittedAnswer['option_ids']
                ?? $submittedAnswer['selected_option_ids']
                ?? (isset($submittedAnswer['selected_option_id']) ? [$submittedAnswer['selected_option_id']] : [])
        )
            ->map(fn ($id) => (string) $id)
            ->unique()
            ->values();

        /*
         * Make sure every selected option actually belongs
         * to the submitted question.
         */
        $questionOptionIds = $question->options
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->values();

        if (
            $selectedOptionIds
                ->diff($questionOptionIds)
                ->isNotEmpty()
        ) {
            throw new LogicException(
                'Submitted option does not belong to the question.'
            );
        }

        /*
         * Correct options for this question.
         */
        $correctOptionIds = $question->options
            ->where('is_correct', true)
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->sort()
            ->values();

        $selectedSorted = $selectedOptionIds
            ->sort()
            ->values();

        /*
         * Exact set comparison.
         *
         * This supports single-choice and multiple-choice
         * questions.
         */
        $isCorrect = $selectedSorted->all() ===
            $correctOptionIds->all();

        $pointsEarned = $isCorrect ? $questionPoints : 0;

        return [
            'points_earned' => $pointsEarned,
            'is_correct' => $isCorrect,
            'fraction' => $isCorrect ? 1.0 : 0.0,
            'normalized_answer' => ['selected_option_ids' => $selectedOptionIds->all()],
            'selected_option_ids' => $selectedOptionIds->all(),
            'evidence' => [
                'selected_option_ids' => $selectedOptionIds->all(),
                'correct_option_ids' => $correctOptionIds->all(),
            ],
            'feedback' => $isCorrect ? 'Correct.' : 'Incorrect.',
        ];
    }

    private function gradeShortAnswer(QuizQuestion $question, array $submittedAnswer, int $questionPoints): array
    {
        $key = $question->answer_key ?? [];

        if (empty($key['accepted']) || ! is_array($key['accepted'])) {
            throw new LogicException('Question is missing an answer key.');
        }

        $raw = $submittedAnswer['value'] ?? $submittedAnswer['text'] ?? $submittedAnswer['answer'] ?? null;

        if (! is_string($raw) && ! is_numeric($raw)) {
            throw new LogicException('A text answer is required for this question.');
        }

        $caseSensitive = (bool) ($key['case_sensitive'] ?? false);
        $normalize = fn ($v) => $caseSensitive ? trim((string) $v) : mb_strtolower(trim((string) $v));

        $given = $normalize($raw);
        $isCorrect = collect($key['accepted'])->contains(fn ($a) => $normalize($a) === $given);
        $pointsEarned = $isCorrect ? $questionPoints : 0;

        return [
            'points_earned' => $pointsEarned,
            'is_correct' => $isCorrect,
            'fraction' => $isCorrect ? 1.0 : 0.0,
            'normalized_answer' => ['value' => trim((string) $raw)],
            'selected_option_ids' => [],
            'evidence' => [
                'given' => trim((string) $raw),
                'accepted_count' => count($key['accepted']),
            ],
            'feedback' => $isCorrect ? 'Correct.' : 'Incorrect.',
        ];
    }

    private function gradeNumeric(QuizQuestion $question, array $submittedAnswer, int $questionPoints): array
    {
        $key = $question->answer_key ?? [];

        if (! isset($key['value']) || ! is_numeric($key['value'])) {
            throw new LogicException('Question is missing an answer key.');
        }

        $raw = $submittedAnswer['value'] ?? $submittedAnswer['answer'] ?? null;

        if (! is_numeric($raw)) {
            throw new LogicException('A numeric answer is required for this question.');
        }

        $tolerance = isset($key['tolerance']) ? (float) $key['tolerance'] : 0.0;
        $isCorrect = abs((float) $raw - (float) $key['value']) <= $tolerance;
        $pointsEarned = $isCorrect ? $questionPoints : 0;

        return [
            'points_earned' => $pointsEarned,
            'is_correct' => $isCorrect,
            'fraction' => $isCorrect ? 1.0 : 0.0,
            'normalized_answer' => ['value' => (float) $raw],
            'selected_option_ids' => [],
            'evidence' => [
                'given' => (float) $raw,
                'tolerance' => $tolerance,
            ],
            'feedback' => $isCorrect ? 'Correct.' : 'Incorrect.',
        ];
    }

    private function gradeOrdering(QuizQuestion $question, array $submittedAnswer, int $questionPoints): array
    {
        $key = $question->answer_key ?? [];

        if (empty($key['ordered_option_ids']) || ! is_array($key['ordered_option_ids'])) {
            throw new LogicException('Question is missing an answer key.');
        }

        $ordered = $submittedAnswer['ordered_ids']
            ?? $submittedAnswer['selected_option_ids']
            ?? $submittedAnswer['option_ids']
            ?? null;

        if (! is_array($ordered)) {
            throw new LogicException('An ordered list of options is required for this question.');
        }

        $ordered = array_values(array_map(strval(...), $ordered));
        $expected = array_values(array_map(strval(...), $key['ordered_option_ids']));

        $questionOptionIds = $question->options
            ->pluck('id')
            ->map(fn ($id) => (string) $id)
            ->values()
            ->all();

        if (array_diff($ordered, $questionOptionIds) !== [] || count($ordered) !== count($expected)) {
            throw new LogicException('Submitted ordering does not match the question options.');
        }

        $correctPositions = 0;
        foreach ($expected as $i => $id) {
            if (($ordered[$i] ?? null) === $id) {
                $correctPositions++;
            }
        }

        $fraction = count($expected) > 0 ? $correctPositions / count($expected) : 0.0;
        $pointsEarned = (int) round($fraction * $questionPoints);
        $isCorrect = $fraction >= 1.0;

        return [
            'points_earned' => $pointsEarned,
            'is_correct' => $isCorrect,
            'fraction' => round($fraction, 4),
            'normalized_answer' => ['ordered_ids' => $ordered],
            'selected_option_ids' => [],
            'evidence' => [
                'ordered_ids' => $ordered,
                'correct_positions' => $correctPositions,
                'total_positions' => count($expected),
            ],
            'feedback' => $isCorrect
                ? 'Correct.'
                : "Partially correct: {$correctPositions}/".count($expected).' in the right position.',
        ];
    }

    private function gradeMatching(QuizQuestion $question, array $submittedAnswer, int $questionPoints): array
    {
        $key = $question->answer_key ?? [];

        if (empty($key['pairs']) || ! is_array($key['pairs'])) {
            throw new LogicException('Question is missing an answer key.');
        }

        $matches = $submittedAnswer['matches'] ?? null;

        if (is_array($matches) && array_is_list($matches)) {
            // [{left, right}, ...] shape
            $normalized = [];
            foreach ($matches as $pair) {
                if (! is_array($pair) || ! isset($pair['left'], $pair['right'])) {
                    throw new LogicException('Each match must contain left and right values.');
                }
                $normalized[(string) $pair['left']] = (string) $pair['right'];
            }
            $matches = $normalized;
        }

        if (! is_array($matches)) {
            throw new LogicException('A set of matches is required for this question.');
        }

        $expected = [];
        foreach ($key['pairs'] as $left => $right) {
            $expected[(string) $left] = (string) $right;
        }

        $given = [];
        foreach ($matches as $left => $right) {
            $given[(string) $left] = (string) $right;
        }

        $correct = 0;
        foreach ($expected as $left => $right) {
            if (array_key_exists($left, $given) && $given[$left] === $right) {
                $correct++;
            }
        }

        $fraction = count($expected) > 0 ? $correct / count($expected) : 0.0;
        $pointsEarned = (int) round($fraction * $questionPoints);
        $isCorrect = $fraction >= 1.0;

        return [
            'points_earned' => $pointsEarned,
            'is_correct' => $isCorrect,
            'fraction' => round($fraction, 4),
            'normalized_answer' => ['matches' => $given],
            'selected_option_ids' => [],
            'evidence' => [
                'matches' => $given,
                'correct_pairs' => $correct,
                'total_pairs' => count($expected),
            ],
            'feedback' => $isCorrect
                ? 'Correct.'
                : "Partially correct: {$correct}/".count($expected).' pairs matched.',
        ];
    }

    /**
     * Classify correctness × confidence per spec §8.
     */
    public function classifyConfidence(bool $isCorrect, mixed $confidenceLevel): string
    {
        $level = $confidenceLevel instanceof ConfidenceLevel
            ? $confidenceLevel->value
            : ($confidenceLevel !== null ? (string) $confidenceLevel : null);

        if ($level === null || $level === '') {
            return 'unrated';
        }

        $high = in_array($level, [
            ConfidenceLevel::CONFIDENT->value,
            ConfidenceLevel::VERY_CONFIDENT->value,
        ], true);

        return match (true) {
            $isCorrect && $high => 'strong_knowledge',
            $isCorrect && ! $high => 'fragile_knowledge',
            ! $isCorrect && $high => 'misconception',
            default => 'knowledge_gap',
        };
    }

    public function confidenceToScore(mixed $confidenceLevel): float
    {
        $level = $confidenceLevel instanceof ConfidenceLevel
            ? $confidenceLevel->value
            : (string) $confidenceLevel;

        return match ($level) {
            ConfidenceLevel::GUESSING->value => 25.0,
            ConfidenceLevel::SOMEWHAT_CONFIDENT->value => 50.0,
            ConfidenceLevel::CONFIDENT->value => 75.0,
            ConfidenceLevel::VERY_CONFIDENT->value => 100.0,
            default => 50.0,
        };
    }
}
