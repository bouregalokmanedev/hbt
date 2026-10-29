<?php

namespace App\Domains\Assignments\DTOs;

final readonly class GradeAssignmentSubmissionData
{
    public function __construct(
        public float $grade,
        public ?string $feedback,
    ) {
    }

    public static function fromArray(array $data): self
    {
        $feedback = isset($data['feedback'])
            ? trim((string) $data['feedback'])
            : '';

        return new self(
            grade: (float) $data['grade'],
            feedback: $feedback === '' ? null : $feedback,
        );
    }
}
