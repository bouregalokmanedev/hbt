<?php

namespace App\Domains\AI\DTOs;

final readonly class MentorContext
{
    public function __construct(
        public string $userId,
        public ?string $courseId,
        public ?string $lessonId,
        public array $course,
        public array $progress,
        public array $assessments,
        public array $quizzes,
        public array $diagnosticScenarios,
        public array $memories,
        public array $retrievedChunks = [],
        public readonly ?MentorStudentProfile $studentProfile = null,
        public readonly ?MentorAdaptation $adaptation = null,
        public readonly ?MentorLessonContext $lessonContext = null,
    ) {
    }

    public function toArray(): array
    {
        return [
            'user_id' => $this->userId,
            'course_id' => $this->courseId,
            'lesson_id' => $this->lessonId,

            'course' => $this->course,
            'progress' => $this->progress,
            'assessments' => $this->assessments,
            'quizzes' => $this->quizzes,
            'diagnostic_scenarios' => $this->diagnosticScenarios,

            'memories' => $this->memories,

            'retrieved_chunks' => array_map(
                static fn ($chunk) => $chunk instanceof \App\Domains\AI\RAG\DTOs\MentorRetrievedChunk
                    ? $chunk->toArray()
                    : $chunk,
                $this->retrievedChunks,
            ),

            'student_profile' => $this->studentProfile?->toArray(),

            'adaptation' => $this->adaptation?->toArray(),

            'lesson_context' => $this->lessonContext?->toArray(),
        ];
    }
}