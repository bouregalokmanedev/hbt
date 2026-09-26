<?php

namespace App\Domains\Assessments\Providers;

use App\Domains\Assessments\Contracts\AnswerEvaluationProvider;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

final class OpenAIAnswerEvaluationProvider implements AnswerEvaluationProvider
{
    public function evaluate(
        string $question,
        string $answer,
        array $rubric,
        ?string $sampleAnswer = null,
    ): array {
        $key = config('services.openai.key');

        if (empty($key)) {
            return $this->unavailable();
        }

        $criteria = collect($rubric)->map(fn ($c, $i) => [
            'key' => $c['key'] ?? "criterion_{$i}",
            'description' => $c['description'] ?? '',
            'points' => (int) ($c['points'] ?? 0),
        ])->values()->all();

        $prompt = $this->prompt($question, $answer, $criteria, $sampleAnswer);

        try {
            $response = Http::withToken($key)
                ->timeout((int) config('services.openai.evaluation_timeout', 60))
                ->post(
                    config('services.openai.url', 'https://api.openai.com/v1/chat/completions'),
                    [
                        'model' => config('services.openai.evaluation_model', config('services.openai.model', 'gpt-4o-mini')),
                        'temperature' => 0,
                        'response_format' => ['type' => 'json_object'],
                        'messages' => [
                            ['role' => 'system', 'content' => 'You grade student answers against a rubric. Reply with JSON only.'],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                    ],
                );

            if (! $response->successful()) {
                Log::warning('AI evaluation request failed', ['status' => $response->status()]);

                return $this->unavailable();
            }

            $content = $response->json('choices.0.message.content');

            return $this->parse($content, $criteria);
        } catch (Throwable $e) {
            Log::warning('AI evaluation errored', ['error' => $e->getMessage()]);

            return $this->unavailable();
        }
    }

    private function prompt(string $question, string $answer, array $criteria, ?string $sampleAnswer): string
    {
        $lines = [
            'Question:',
            $question,
            '',
            'Rubric (award 0 up to the listed points per criterion):',
        ];

        foreach ($criteria as $criterion) {
            $lines[] = "- {$criterion['key']} ({$criterion['points']} pts): {$criterion['description']}";
        }

        if ($sampleAnswer !== null && $sampleAnswer !== '') {
            $lines[] = '';
            $lines[] = 'Reference answer:';
            $lines[] = $sampleAnswer;
        }

        $lines[] = '';
        $lines[] = 'Student answer:';
        $lines[] = $answer;
        $lines[] = '';
        $lines[] = 'Reply as JSON: {"criteria": [{"key": "<key>", "points_earned": <number>, "comment": "<short>"}], "feedback": "<1-2 sentences for the student>"}';

        return implode("\n", $lines);
    }

    private function parse(mixed $content, array $criteria): array
    {
        if (! is_string($content)) {
            return $this->unavailable();
        }

        try {
            $decoded = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            return $this->unavailable();
        }

        $awarded = [];
        foreach ((array) ($decoded['criteria'] ?? []) as $row) {
            if (is_array($row) && isset($row['key'])) {
                $awarded[(string) $row['key']] = $row;
            }
        }

        $earned = 0;
        $possible = 0;
        $detail = [];

        foreach ($criteria as $criterion) {
            $possible += $criterion['points'];
            $row = $awarded[$criterion['key']] ?? [];
            $points = (float) ($row['points_earned'] ?? 0);
            $points = max(0, min($criterion['points'], $points));
            $earned += $points;

            $detail[] = [
                'key' => $criterion['key'],
                'passed' => $points >= $criterion['points'],
                'points' => $points,
                'points_possible' => $criterion['points'],
                'comment' => isset($row['comment']) && is_string($row['comment']) ? $row['comment'] : null,
            ];
        }

        if ($possible <= 0) {
            return $this->unavailable();
        }

        $feedback = isset($decoded['feedback']) && is_string($decoded['feedback']) && $decoded['feedback'] !== ''
            ? $decoded['feedback']
            : 'Graded against the rubric.';

        return [
            'available' => true,
            'fraction' => $earned / $possible,
            'criteria' => $detail,
            'feedback' => $feedback,
        ];
    }

    private function unavailable(): array
    {
        return [
            'available' => false,
            'fraction' => 0.0,
            'criteria' => [],
            'feedback' => 'Awaiting review.',
        ];
    }
}
