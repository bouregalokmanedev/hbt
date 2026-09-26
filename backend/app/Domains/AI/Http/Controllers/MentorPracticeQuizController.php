<?php

namespace App\Domains\AI\Http\Controllers;

use App\Domains\AI\RAG\Services\DatabaseMentorContentRetriever;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class MentorPracticeQuizController
{
    public function __construct(private readonly DatabaseMentorContentRetriever $retriever) {}

    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'topic' => ['nullable', 'string', 'max:200'],
            'course_id' => ['nullable', 'uuid', 'exists:courses,id'],
            'lesson_id' => ['nullable', 'uuid', 'exists:lessons,id'],
        ]);

        $topic = trim((string) ($data['topic'] ?? ''));
        if ($topic === '') {
            $topic = 'diagnostic skills';
        }

        $chunks = $this->retriever->retrieve($topic, $data['course_id'] ?? null, $data['lesson_id'] ?? null, 3);

        // If we have lesson chunks, generate contextual questions; otherwise generic
        $questions = [];

        if ($chunks !== []) {
            foreach (array_slice($chunks, 0, 2) as $chunk) {
                $title = trim($chunk->title ?? $chunk->sourceId ?? $topic);
                $questions[] = [
                    'id' => (string) Str::uuid(),
                    'question' => "What is the key point of \"{$title}\" related to {$topic}?",
                    'options' => [
                        ['id' => (string) Str::uuid(), 'text' => 'The correct diagnostic step described in the lesson', 'is_correct' => true],
                        ['id' => (string) Str::uuid(), 'text' => 'An unrelated unrelated procedure', 'is_correct' => false],
                        ['id' => (string) Str::uuid(), 'text' => 'Skip the step and guess', 'is_correct' => false],
                        ['id' => (string) Str::uuid(), 'text' => 'Replace the whole system', 'is_correct' => false],
                    ],
                    'points' => 1,
                    'source' => ['type' => $chunk->sourceType, 'id' => $chunk->sourceId],
                ];
            }
        }

        // Ensure at least 3 questions; pad with generic
        while (count($questions) < 3) {
            $questions[] = [
                'id' => (string) Str::uuid(),
                'question' => "When diagnosing {$topic}, which measurement best confirms the fault?",
                'options' => [
                    ['id' => (string) Str::uuid(), 'text' => 'Voltage drop within the specified range', 'is_correct' => true],
                    ['id' => (string) Str::uuid(), 'text' => 'Visual inspection only', 'is_correct' => false],
                    ['id' => (string) Str::uuid(), 'text' => 'Ignoring the specification table', 'is_correct' => false],
                    ['id' => (string) Str::uuid(), 'text' => 'Random component replacement', 'is_correct' => false],
                ],
                'points' => 1,
                'source' => ['type' => 'generic', 'id' => null],
            ];
        }

        // If OpenAI is configured, we could enrich questions here via the prompt service
        // For now we return a stub-compatible practice set that works offline

        return response()->json([
            'success' => true,
            'data' => [
                'id' => (string) Str::uuid(),
                'title' => "Practice: {$topic}",
                'topic' => $topic,
                'questions' => array_slice($questions, 0, 3),
                'stub' => blank(config('services.openai.key')),
            ],
        ]);
    }
}
