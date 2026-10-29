<?php

namespace App\Domains\Assignments\DTOs;

final readonly class CreateAssignmentData
{
    public function __construct(
        public string $title,
        public string $instructions,
        public ?string $slug = null,
        public ?string $dueAt = null,
        public int $maxPoints = 100,
        public bool $allowLateSubmissions = true,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            title: trim((string) $data['title']),
            instructions: trim((string) $data['instructions']),
            slug: isset($data['slug']) && trim((string) $data['slug']) !== ''
                ? trim((string) $data['slug'])
                : null,
            dueAt: $data['due_at'] ?? null,
            maxPoints: (int) ($data['max_points'] ?? 100),
            allowLateSubmissions: (bool) ($data['allow_late_submissions'] ?? true),
        );
    }
}
