<?php

namespace App\Domains\Assessments\Services;

use App\Domains\Assessments\Contracts\AnswerEvaluationProvider;
use App\Domains\Quizzes\Models\QuizQuestion;
use LogicException;

final class AIEvaluationService
{
    public function __construct(
        private readonly AnswerEvaluationProvider $provider,
    ) {}

    /**
     * Grade a long answer against the question's rubric.
     *
     * Rubric format in answer_key:
     * {rubric: [{key, description, points}], sample_answer?}
     *
     * @return array{points_earned: int, is_correct: bool, fraction: float, criteria: array, feedback: string, pending_review: bool}
     */
    public function gradeLongAnswer(QuizQuestion $question, mixed $raw, int $questionPoints): array
    {
        $key = $question->answer_key ?? [];

        if (empty($key['rubric']) || ! is_array($key['rubric'])) {
            throw new LogicException('Question is missing an answer key.');
        }

        $rubric = [];
        foreach ($key['rubric'] as $i => $criterion) {
            if (! is_array($criterion) || ($criterion['description'] ?? '') === '') {
                throw new LogicException('Rubric criterion '.($i + 1).' needs a description.');
            }

            $rubric[] = [
                'key' => (string) ($criterion['key'] ?? 'criterion_'.($i + 1)),
                'description' => (string) $criterion['description'],
                'points' => max(0, (int) ($criterion['points'] ?? 0)),
            ];
        }

        $rubricTotal = array_sum(array_column($rubric, 'points'));

        if ($rubricTotal <= 0) {
            throw new LogicException('Rubric criteria must carry points.');
        }

        if (! is_string($raw) && ! is_numeric($raw)) {
            throw new LogicException('A text answer is required for this question.');
        }

        $answer = trim((string) $raw);

        if ($answer === '') {
            return [
                'points_earned' => 0,
                'is_correct' => false,
                'fraction' => 0.0,
                'criteria' => [],
                'feedback' => 'No answer provided.',
                'pending_review' => false,
            ];
        }

        $result = $this->provider->evaluate(
            $question->question,
            $answer,
            $rubric,
            isset($key['sample_answer']) ? (string) $key['sample_answer'] : null,
        );

        if (! ($result['available'] ?? false)) {
            return [
                'points_earned' => 0,
                'is_correct' => false,
                'fraction' => 0.0,
                'criteria' => [],
                'feedback' => $result['feedback'] ?? 'Awaiting review.',
                'pending_review' => true,
            ];
        }

        $fraction = max(0.0, min(1.0, (float) ($result['fraction'] ?? 0)));
        $pointsEarned = (int) round($fraction * $questionPoints);

        return [
            'points_earned' => $pointsEarned,
            'is_correct' => $fraction >= 1.0,
            'fraction' => round($fraction, 4),
            'criteria' => $result['criteria'] ?? [],
            'feedback' => $result['feedback'] ?? 'Graded against the rubric.',
            'pending_review' => false,
        ];
    }
}
