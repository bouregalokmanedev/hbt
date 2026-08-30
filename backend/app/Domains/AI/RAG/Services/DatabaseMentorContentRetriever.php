<?php

namespace App\Domains\AI\RAG\Services;

use App\Domains\AI\RAG\Contracts\MentorContentRetriever;
use App\Domains\AI\RAG\DTOs\MentorRetrievedChunk;
use App\Models\Lesson;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

final class DatabaseMentorContentRetriever implements MentorContentRetriever
{
    /**
     * Retrieve relevant published lesson content from the database.
     *
     * Results are ranked using:
     * - title matches: highest weight
     * - description matches: medium weight
     * - content matches: normal weight
     *
     * @return array<int, MentorRetrievedChunk>
     */
    public function retrieve(
        string $query,
        ?string $courseId = null,
        ?string $lessonId = null,
        int $limit = 5,
    ): array {
        $query = trim($query);

        if ($query === '' || $limit <= 0) {
            return [];
        }

        $terms = $this->extractTerms($query);

        if ($terms === []) {
            return [];
        }

        $lessons = Lesson::query()
            ->with([
                'section.course',
            ])
            ->where('status', 'published')
            ->when(
                $courseId !== null,
                fn ($query) => $query->whereHas(
                    'section',
                    fn ($sectionQuery) => $sectionQuery->where(
                        'course_id',
                        $courseId,
                    ),
                ),
            )
            ->when(
                $lessonId !== null,
                fn ($query) => $query->whereKey($lessonId),
            )
            ->get();

        return $lessons
            ->map(function (Lesson $lesson) use ($terms): ?MentorRetrievedChunk {
                $score = $this->calculateScore($lesson, $terms);

                if ($score <= 0) {
                    return null;
                }

                $section = $lesson->section;
                $course = $section?->course;

                if ($section === null || $course === null) {
                    return null;
                }

                return new MentorRetrievedChunk(
                    content: (string) ($lesson->content ?? ''),
                    sourceType: 'lesson',
                    sourceId: $lesson->id,
                    title: $lesson->title,
                    score: $score,
                    metadata: [
                        'course_id' => $course->id,
                        'lesson_id' => $lesson->id,
                        'section_id' => $section->id,
                    ],
                );
            })
            ->filter()
            ->sortByDesc(
                fn (MentorRetrievedChunk $chunk) => $chunk->score
            )
            ->take($limit)
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
   private function extractTerms(string $query): array
{
    return collect(
        preg_split('/\s+/', Str::lower(trim($query))) ?: []
    )
        ->map(
            fn (string $term) => trim(
                $term,
                " \t\n\r\0\x0B.,!?;:()[]{}\\\"'"
            )
        )
        ->filter(
            fn (string $term) => $term !== ''
        )
        ->unique()
        ->values()
        ->all();
}

    /**
     * Calculate a relevance score for a lesson.
     *
     * Title matches are weighted more heavily than descriptions,
     * and descriptions are weighted more heavily than body content.
     *
     * @param array<int, string> $terms
     */
    private function calculateScore(
        Lesson $lesson,
        array $terms,
    ): float {
        $title = Str::lower((string) ($lesson->title ?? ''));
        $description = Str::lower((string) ($lesson->description ?? ''));
        $content = Str::lower((string) ($lesson->content ?? ''));

        $score = 0.0;

        foreach ($terms as $term) {
            $score += $this->countOccurrences($title, $term) * 3.0;
            $score += $this->countOccurrences($description, $term) * 2.0;
            $score += $this->countOccurrences($content, $term) * 1.0;
        }

        return $score;
    }

    private function countOccurrences(
        string $haystack,
        string $needle,
    ): int {
        if ($needle === '' || $haystack === '') {
            return 0;
        }

        return substr_count($haystack, $needle);
    }
}