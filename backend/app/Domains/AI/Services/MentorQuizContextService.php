<?php

namespace App\Domains\AI\Services;

use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\User;

final class MentorQuizContextService
{
    public function build(
        User $user,
        ?string $courseId = null,
    ): array {
        $attempts = QuizAttempt::query()
            ->with([
                'quiz.section.course',
                'answers.question',
            ])
            ->where('user_id', $user->id)
            ->when(
                $courseId !== null,
                fn ($query) => $query->whereHas(
                    'quiz.section',
                    fn ($query) => $query->where(
                        'course_id',
                        $courseId
                    )
                )
            )
            ->whereIn('status', [
                'submitted',
            ])
            ->latest('submitted_at')
            ->get();

        if ($attempts->isEmpty()) {
            return [];
        }

        $latest = $attempts->first();

        return [
            'attempt_count' => $attempts->count(),

            'latest' => [
                'quiz_id' => $latest->quiz_id,
                'quiz_title' => $latest->quiz->title,

                'score' => $latest->score,
                'total_points' => $latest->total_points,
                'percentage' => $latest->percentage,

                'passed' => $latest->passed,

                'submitted_at' => $latest->submitted_at?->toISOString(),
            ],

            'question_performance' => $this->questionPerformance(
                $latest
            ),

            'weak_questions' => $this->weakQuestions(
                $latest
            ),

            'recent_attempts' => $attempts
                ->take(5)
                ->map(fn (QuizAttempt $attempt) => [
                    'quiz_id' => $attempt->quiz_id,
                    'quiz_title' => $attempt->quiz->title,
                    'percentage' => $attempt->percentage,
                    'passed' => $attempt->passed,
                    'submitted_at' => $attempt->submitted_at?->toISOString(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function questionPerformance(
        QuizAttempt $attempt,
    ): array {
        $answers = $attempt->answers;

        $total = $answers->count();

        if ($total === 0) {
            return [
                'total' => 0,
                'correct' => 0,
                'incorrect' => 0,
                'accuracy' => 0,
            ];
        }

        $correct = $answers
            ->where('is_correct', true)
            ->count();

        return [
            'total' => $total,
            'correct' => $correct,
            'incorrect' => $total - $correct,
            'accuracy' => (int) round(
                ($correct / $total) * 100
            ),
        ];
    }

    private function weakQuestions(
        QuizAttempt $attempt,
    ): array {
        return $attempt->answers
            ->where('is_correct', false)
            ->sortByDesc('points_earned')
            ->take(5)
            ->map(
                fn ($answer) => [
                    'question_id' => $answer->question_id,
                    'question' => $answer->question?->question,
                    'points' => $answer->question?->points,
                ]
            )
            ->values()
            ->all();
    }
}