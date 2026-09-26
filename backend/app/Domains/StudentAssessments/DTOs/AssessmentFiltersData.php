<?php

namespace App\Domains\StudentAssessments\DTOs;

final class AssessmentFiltersData
{
    public function __construct(
        public readonly ?string $status = null,
        public readonly ?string $courseId = null,
        public readonly ?string $search = null,
        public readonly int $page = 1,
        public readonly int $perPage = 15,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            status: $data['status'] ?? null,
            courseId: $data['course_id'] ?? null,
            search: $data['search'] ?? null,
            page: (int) ($data['page'] ?? 1),
            perPage: (int) ($data['per_page'] ?? 15),
        );
    }
}
