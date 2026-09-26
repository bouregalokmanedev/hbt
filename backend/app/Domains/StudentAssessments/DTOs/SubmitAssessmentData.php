<?php

namespace App\Domains\StudentAssessments\DTOs;

final class SubmitAssessmentData
{
    public function __construct(
        public readonly string $attemptId,
        public readonly string $studentId,
        public readonly array $answers = [],
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            attemptId: $data['attempt_id'],
            studentId: $data['student_id'],
            answers: $data['answers'] ?? [],
        );
    }
}
