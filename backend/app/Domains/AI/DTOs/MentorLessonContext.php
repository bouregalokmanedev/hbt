<?php

namespace App\Domains\AI\DTOs;

final readonly class MentorLessonContext
{
    public function __construct(
        public string $lessonId,
        public string $courseId,
        public string $sectionId,
        public string $title,
        public ?string $description = null,
        public ?string $content = null,
        public int $position = 0,
        public int $durationMinutes = 0,
        public bool $isPreview = false,
        public string $status = 'draft',
        public int $progressPercentage = 0,
        public int $timeSpent = 0,
        public bool $completed = false,
    ) {
    }

    public function toArray(): array
    {
        return [
            'lesson_id' => $this->lessonId,
            'course_id' => $this->courseId,
            'section_id' => $this->sectionId,
            'title' => $this->title,
            'description' => $this->description,
            'content' => $this->content,
            'position' => $this->position,
            'duration_minutes' => $this->durationMinutes,
            'is_preview' => $this->isPreview,
            'status' => $this->status,
            'progress_percentage' => $this->progressPercentage,
            'time_spent' => $this->timeSpent,
            'completed' => $this->completed,
        ];
    }
}