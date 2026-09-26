<?php

namespace App\Domains\StudentAssessments\DTOs;

final class StartAssessmentData
{
    public function __construct(
        public readonly string $assessmentId,
        public readonly string $studentId,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            assessmentId: $data['assessment_id'],
            studentId: $data['student_id'],
        );
    }
}
